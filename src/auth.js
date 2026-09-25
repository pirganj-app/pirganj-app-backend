const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabase } = require('./supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-change-me';
const fallbackUsers = new Map();
const fallbackItems = new Map();

function normalizePhone(phone) {
  return String(phone || '').replace(/[\s()-]/g, '').trim();
}

function signUser(user) {
  return jwt.sign({ sub: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });
}

function publicUser(user) {
  return { id: user.id, phone: user.phone, name: user.name, sex: user.sex, address: user.address || '' };
}

async function registerUser({ phone, password, name, sex, address }) {
  const normalized = normalizePhone(phone);
  if (!/^\+?[0-9]{8,15}$/.test(normalized)) throw new Error('A valid phone number is required');
  if (!password || String(password).length < 6) throw new Error('Password must be at least 6 characters');
  if (!name || !sex || !address) throw new Error('Name, sex, and address are required');
  const db = getSupabase();
  const passwordHash = await bcrypt.hash(String(password), 12);
  if (!db) {
    if (fallbackUsers.has(normalized)) { const error = new Error('Phone number is already registered'); error.status = 409; throw error; }
    const user = { id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`, phone: normalized, password_hash: passwordHash, name: String(name).trim(), sex: String(sex).trim(), address: String(address).trim() };
    fallbackUsers.set(normalized, user);
    return { token: signUser(user), user: publicUser(user) };
  }
  const existing = await db.from('users').select('id').eq('phone', normalized).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) { const error = new Error('Phone number is already registered'); error.status = 409; throw error; }
  const { data, error } = await db.from('users').insert({ phone: normalized, password_hash: passwordHash, name: String(name).trim(), sex: String(sex).trim(), address: String(address).trim() }).select('*').single();
  if (error) throw error;
  return { token: signUser(data), user: publicUser(data) };
}

async function loginUser({ phone, password }) {
  const normalized = normalizePhone(phone);
  const db = getSupabase();
  const user = db ? (await db.from('users').select('*').eq('phone', normalized).maybeSingle()).data : fallbackUsers.get(normalized);
  if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash))) { const error = new Error('Phone number or password is incorrect'); error.status = 401; throw error; }
  return { token: signUser(user), user: publicUser(user) };
}

async function getUserById(id) {
  const db = getSupabase();
  if (!db) return [...fallbackUsers.values()].find((user) => user.id === id) || null;
  const { data, error } = await db.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function updateUser(id, fields) {
  const allowed = { name: fields.name, sex: fields.sex, address: fields.address };
  const clean = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));
  const db = getSupabase();
  if (!db) { const user = await getUserById(id); if (!user) return null; Object.assign(user, clean); return publicUser(user); }
  const { data, error } = await db.from('users').update(clean).eq('id', id).select('*').single();
  if (error) throw error;
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

function rememberFallbackItem(item) {
  if (item && item.id && item.ownerId) fallbackItems.set(String(item.id), item);
  return item;
}

function getFallbackItem(id) { return fallbackItems.get(String(id)); }
function deleteFallbackItem(id) { return fallbackItems.delete(String(id)); }

module.exports = { normalizePhone, registerUser, loginUser, getUserById, updateUser, deleteUser, authenticate, rememberFallbackItem, getFallbackItem, deleteFallbackItem };
