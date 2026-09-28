const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabase } = require('./supabase');
const { getFirebase } = require('./push');
const { removeImageByUrl, removeImagesByUrls, removeImagesByPrefixes, toDatabaseUrl, toPublicUrl } = require('./storage');

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-change-me';
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 2 * 60 * 60 * 1000;
const fallbackUsers = new Map();
const fallbackItems = new Map();
const loginFailures = new Map();

function normalizePhone(phone) {
  return String(phone || '').replace(/[\s()-]/g, '').trim();
}

function signUser(user) {
  return jwt.sign({ sub: user.id, phone: user.phone, profileLocked: user.profile_locked === true || user.profileLocked === true }, JWT_SECRET, { expiresIn: '30d' });
}

function publicUser(user) {
  return { id: user.id, phone: user.phone, name: user.name, sex: user.sex, address: user.address || '', avatarUrl: toPublicUrl(user.avatar_url || user.avatarUrl || null), profileLocked: user.profile_locked === true || user.profileLocked === true };
}

async function registerUser({ phone, password, name, sex, address, avatarUrl }) {
  const normalized = normalizePhone(phone);
  if (!/^\d{11}$/.test(normalized)) throw new Error('Phone number must be exactly 11 digits');
  if (!password || String(password).length < 6) throw new Error('Password must be at least 6 characters');
  if (!name || !sex || !address) throw new Error('Name, sex, and address are required');
  const db = getSupabase();
  avatarUrl = toDatabaseUrl(avatarUrl);
  const passwordHash = await bcrypt.hash(String(password), 12);
  if (!db) {
    if (fallbackUsers.has(normalized)) { const error = new Error('Phone number is already registered'); error.status = 409; throw error; }
    const user = { id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`, phone: normalized, password_hash: passwordHash, name: String(name).trim(), sex: String(sex).trim(), address: String(address).trim(), avatar_url: avatarUrl || null, profile_locked: false };
    fallbackUsers.set(normalized, user);
    return { token: signUser(user), user: publicUser(user) };
  }
  const existing = await db.from('users').select('id').eq('phone', normalized).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) { const error = new Error('Phone number is already registered'); error.status = 409; throw error; }
  const { data, error } = await db.from('users').insert({ phone: normalized, password_hash: passwordHash, name: String(name).trim(), sex: String(sex).trim(), address: String(address).trim(), avatar_url: avatarUrl || null }).select('*').single();
  if (error) throw error;
  return { token: signUser(data), user: publicUser(data) };
}

function deviceKey(deviceId) {
  return String(deviceId || 'unknown-device').trim().slice(0, 160) || 'unknown-device';
}

function assertDeviceNotLocked(deviceId) {
  const key = deviceKey(deviceId);
  const state = loginFailures.get(key);
  if (!state) return;
  if (!state.lockedUntil) return;
  if (state.lockedUntil > Date.now()) {
    const error = new Error('এই ডিভাইসে ২ ঘণ্টার জন্য login বন্ধ আছে');
    error.status = 429;
    error.retryAfterSeconds = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    throw error;
  }
  loginFailures.delete(key);
}

function recordLoginFailure(deviceId) {
  const key = deviceKey(deviceId);
  const previous = loginFailures.get(key) || { attempts: 0, lockedUntil: 0 };
  const attempts = previous.attempts + 1;
  loginFailures.set(key, {
    attempts,
    lockedUntil: attempts >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOGIN_LOCKOUT_MS : 0,
  });
}

function clearLoginFailures(deviceId) { loginFailures.delete(deviceKey(deviceId)); }

async function loginUser({ phone, password, deviceId }) {
  assertDeviceNotLocked(deviceId);
  const normalized = normalizePhone(phone);
  if (!/^\d{11}$/.test(normalized)) throw new Error('Phone number must be exactly 11 digits');
  const db = getSupabase();
  const user = db ? (await db.from('users').select('*').eq('phone', normalized).maybeSingle()).data : fallbackUsers.get(normalized);
  if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash))) {
    recordLoginFailure(deviceId);
    const error = new Error('Phone number or password is incorrect');
    error.status = 401;
    throw error;
  }
  clearLoginFailures(deviceId);
  return { token: signUser(user), user: publicUser(user) };
}

async function loginWithGoogle(idToken) {
  const firebase = getFirebase();
  if (!firebase) {
    const error = new Error('Google login server configuration is missing');
    error.status = 503;
    throw error;
  }
  const decoded = await firebase.auth().verifyIdToken(String(idToken || ''));
  const phone = `google:${decoded.uid}`;
  const db = getSupabase();
  if (!db) {
    let user = fallbackUsers.get(phone);
    if (!user) {
      user = { id: `google-${decoded.uid}`, phone, password_hash: '', name: decoded.name || decoded.email || 'Google User', sex: 'অন্যান্য', address: '', avatar_url: decoded.picture || null, profile_locked: false };
      fallbackUsers.set(phone, user);
    }
    return { token: signUser(user), user: publicUser(user) };
  }
  const existing = await db.from('users').select('*').eq('phone', phone).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return { token: signUser(existing.data), user: publicUser(existing.data) };
  const created = await db.from('users').insert({ phone, password_hash: `google:${decoded.uid}`, name: decoded.name || decoded.email || 'Google User', sex: 'অন্যান্য', address: '', avatar_url: decoded.picture || null }).select('*').single();
  if (created.error) throw created.error;
  return { token: signUser(created.data), user: publicUser(created.data) };
}

async function getUserById(id) {
  const db = getSupabase();
  if (!db) return [...fallbackUsers.values()].find((user) => user.id === id) || null;
  const { data, error } = await db.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getUsersByIds(ids) {
  const uniqueIds = [...new Set((ids || []).filter(Boolean).map(String))];
  if (!uniqueIds.length) return new Map();
  const db = getSupabase();
  if (!db) {
    return new Map([...fallbackUsers.values()]
      .filter((user) => uniqueIds.includes(String(user.id)))
      .map((user) => [String(user.id), user]));
  }
  const { data, error } = await db.from('users').select('*').in('id', uniqueIds);
  if (error) throw error;
  return new Map((data || []).map((user) => [String(user.id), user]));
}

async function updateUser(id, fields) {
  const requestedLock = fields.profileLocked === undefined ? fields.profile_locked : fields.profileLocked;
  const allowed = { name: fields.name == null ? undefined : fields.name, sex: fields.sex == null ? undefined : fields.sex, address: fields.address == null ? undefined : fields.address, avatar_url: fields.avatarUrl === undefined ? undefined : toDatabaseUrl(fields.avatarUrl), profile_locked: requestedLock === undefined ? undefined : requestedLock === true || requestedLock === 'true' };
  const clean = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));
  const db = getSupabase();
  if (!db) { const user = await getUserById(id); if (!user) return null; Object.assign(user, clean); return publicUser(user); }
  const previous = await db.from('users').select('avatar_url').eq('id', id).maybeSingle();
  if (previous.error) throw previous.error;
  const { data, error } = await db.from('users').update(clean).eq('id', id).select('*').single();
  if (error) throw error;
  if (clean.avatar_url !== undefined && previous.data?.avatar_url && previous.data.avatar_url !== data.avatar_url) await removeImageByUrl(previous.data.avatar_url);
  return publicUser(data);
}

async function deleteUser(id) {
  const db = getSupabase();
  if (!db) {
    const user = await getUserById(id);
    if (!user) return false;
    fallbackUsers.delete(user.phone);
    for (const [key, item] of fallbackItems.entries()) {
      if (item.ownerId === id) fallbackItems.delete(key);
    }
    return true;
  }

  const user = await db.from('users').select('id,avatar_url').eq('id', id).maybeSingle();
  if (user.error) throw user.error;
  if (!user.data) return false;
  const [profile, services, posts, notices, lostFound] = await Promise.all([
    db.from('profiles').select('avatar_url').eq('id', id).maybeSingle(),
    db.from('services').select('image_url').eq('owner_id', id),
    db.from('posts').select('image_url').eq('owner_id', id),
    db.from('notices').select('image_url').eq('owner_id', id),
    db.from('lost_found').select('image_url').eq('owner_id', id),
  ]);
  for (const result of [profile, services, posts, notices, lostFound]) {
    if (result.error) throw result.error;
  }
  const imageUrls = [
    user.data.avatar_url,
    profile.data?.avatar_url,
    ...(services.data || []).map((row) => row.image_url),
    ...(posts.data || []).map((row) => row.image_url),
    ...(notices.data || []).map((row) => row.image_url),
    ...(lostFound.data || []).map((row) => row.image_url),
  ].filter(Boolean);

  // If Storage cleanup fails, stop before deleting database rows so the user
  // can retry and no owned files are orphaned by a partial account deletion.
  await removeImagesByUrls(imageUrls);
  await removeImagesByPrefixes([`profiles/${id}`, `posts/${id}`, `lost_found/${id}`]);
  const [actorNotifications, profileDelete] = await Promise.all([
    db.from('notifications').delete().eq('actor_id', id).select('id'),
    db.from('profiles').delete().eq('id', id).select('id'),
  ]);
  if (actorNotifications.error) throw actorNotifications.error;
  if (profileDelete.error) throw profileDelete.error;
  const { data, error } = await db.from('users').delete().eq('id', id).select('id');
  if (error) throw error;
  return Boolean(data?.length);
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, data: { message: 'Login required' } });
  try { req.user = jwt.verify(token, JWT_SECRET); return next(); } catch (_error) { return res.status(401).json({ success: false, data: { message: 'Invalid or expired login session' } }); }
}

function optionalAuthenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token) { try { req.user = jwt.verify(token, JWT_SECRET); } catch (_) {} }
  return next();
}

function rememberFallbackItem(item) {
  if (item && item.id && item.ownerId) fallbackItems.set(String(item.id), item);
  return item;
}

function getFallbackItem(id) { return fallbackItems.get(String(id)); }
function deleteFallbackItem(id) { return fallbackItems.delete(String(id)); }

module.exports = { normalizePhone, publicUser, registerUser, loginUser, loginWithGoogle, getUserById, getUsersByIds, updateUser, deleteUser, authenticate, optionalAuthenticate, rememberFallbackItem, getFallbackItem, deleteFallbackItem };
