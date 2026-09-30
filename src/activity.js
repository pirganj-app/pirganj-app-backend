const { getSupabase } = require('./supabase');

const fallbackActivity = [];
const MAX_FALLBACK_ACTIVITY = 5000;
const ALLOWED_EVENTS = new Set(['successfully_login', 'logout', 'হোম', 'কমিউনিটি', 'প্রোফাইল', 'যোগ করুন', 'হাসপাতাল', 'ক্লিনিক', 'ফার্মেসি', 'রেস্টুরেন্ট', 'হোটেল', 'সরকারি অফিস', 'অ্যাম্বুলেন্স', 'গাড়ি ভাড়া', 'সার্চ']);

function cleanEvent(action) {
  const value = String(action || '').trim().slice(0, 60);
  return ALLOWED_EVENTS.has(value) ? value : null;
}

async function logActivity({ userId = null, action } = {}) {
  const event = cleanEvent(action);
  if (!event) return;
  // Deliberately persist only the user, named event and timestamp. Routes,
  // request details, metadata, IP addresses and user agents are not stored.
  const row = { user_id: userId || null, action: event };
  const db = getSupabase();
  if (!db) {
    fallbackActivity.unshift({ id: `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`, ...row, created_at: new Date().toISOString() });
    if (fallbackActivity.length > MAX_FALLBACK_ACTIVITY) fallbackActivity.length = MAX_FALLBACK_ACTIVITY;
    return;
  }
  try {
    const { error } = await db.from('activity').insert(row);
    if (error) console.error('Activity log failed:', error.message);
  } catch (error) {
    console.error('Activity log failed:', error.message);
  }
}

function periodStart(period) {
  const now = Date.now();
  if (period === 'today') return new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  if (period === '7days') return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (period === '30days') return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

async function listActivity({ userId = null, period = 'all', limit = 100, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const start = periodStart(period);
  const matches = (row) => (!userId || row.user_id === userId) && (!start || row.created_at >= start);
  const db = getSupabase();
  if (!db) return fallbackActivity.filter(matches).slice(safeOffset, safeOffset + safeLimit).map(publicActivity);
  let query = db.from('activity').select('id,user_id,action,created_at').order('created_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1);
  if (userId) query = query.eq('user_id', userId);
  if (start) query = query.gte('created_at', start);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(publicActivity);
}

function publicActivity(row) {
  return { id: row.id, user_id: row.user_id, action: row.action, created_at: row.created_at };
}

async function deleteActivity({ userId = null, period = 'all' } = {}) {
  const start = periodStart(period);
  const matches = (row) => (!userId || row.user_id === userId) && (!start || row.created_at >= start);
  const db = getSupabase();
  if (!db) {
    const before = fallbackActivity.length;
    for (let index = fallbackActivity.length - 1; index >= 0; index -= 1) {
      if (matches(fallbackActivity[index])) fallbackActivity.splice(index, 1);
    }
    return { deleted: before - fallbackActivity.length };
  }
  let query = db.from('activity').delete({ count: 'exact' });
  if (userId) query = query.eq('user_id', userId);
  if (start) query = query.gte('created_at', start);
  // Supabase requires a filter for safe deletes; all-period deletion is scoped
  // to existing rows through the non-null created_at column.
  if (!start) query = query.not('created_at', 'is', null);
  const { count, error } = await query;
  if (error) throw error;
  return { deleted: count || 0 };
}

module.exports = { logActivity, listActivity, deleteActivity, cleanEvent };
