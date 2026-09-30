const jwt = require('jsonwebtoken');
const { getSupabase } = require('./supabase');
const { listActivity } = require('./activity');
const { getLoginSecurity, clearDeviceLock } = require('./auth');
const { notifyAllUsers, createNotification } = require('./notifications');

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-change-me';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'shuaib@Admin103599@#hack';

function adminLogin(username, password) {
  if (String(username || '') !== ADMIN_USERNAME || String(password || '') !== ADMIN_PASSWORD) {
    const error = new Error('এডমিন username অথবা password সঠিক নয়');
    error.status = 401;
    throw error;
  }
  return { token: jwt.sign({ sub: `admin:${ADMIN_USERNAME}`, role: 'admin' }, JWT_SECRET, { expiresIn: '12h' }) };
}

function authenticateAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, data: { message: 'এডমিন login প্রয়োজন' } });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('not admin');
    req.admin = payload;
    return next();
  } catch (_) {
    return res.status(401).json({ success: false, data: { message: 'এডমিন session শেষ হয়েছে' } });
  }
}

async function listUsers({ limit = 100, offset = 0, name = '', email = '', phone = '' } = {}) {
  const db = getSupabase();
  if (!db) return [];
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  let query = db.from('users').select('id,email,phone,name,is_blocked,failed_login_attempts,locked_until').order('created_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1);
  if (name) query = query.ilike('name', `%${String(name).replace(/[%_]/g, '')}%`);
  if (email) query = query.ilike('email', `%${String(email).replace(/[%_]/g, '')}%`);
  if (phone) query = query.ilike('phone', `%${String(phone).replace(/[%_]/g, '')}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function setUserBlocked(id, blocked) {
  const db = getSupabase();
  if (!db) return { id, is_blocked: Boolean(blocked) };
  const { data, error } = await db.from('users').update({ is_blocked: Boolean(blocked) }).eq('id', id).select('id,is_blocked').maybeSingle();
  if (error) throw error;
  return data;
}

async function listDevices({ limit = 100, offset = 0 } = {}) {
  const db = getSupabase();
  if (!db) return getLoginSecurity();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const { data, error } = await db.from('login_devices').select('id,user_id,device_id,failed_attempts,locked_until,last_attempt_at').order('last_attempt_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1);
  if (error) throw error;
  return data || [];
}

async function unblockDevice(id) {
  const db = getSupabase();
  if (!db) return { deviceId: id, unlocked: clearDeviceLock(id) };
  const { data, error } = await db.from('login_devices').update({ failed_attempts: 0, locked_until: null }).eq('id', id).select('id,device_id,locked_until').maybeSingle();
  if (error) throw error;
  return data;
}

async function sendMessage({ userId, title, body }) {
  if (userId) return createNotification({ userId, actorId: null, type: 'admin_message', title, body });
  return notifyAllUsers({ actorId: null, type: 'admin_message', title, body, entityType: null, entityId: null });
}

module.exports = { adminLogin, authenticateAdmin, listUsers, setUserBlocked, listDevices, unblockDevice, listActivity, sendMessage };
