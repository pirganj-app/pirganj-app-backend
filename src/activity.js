const { getSupabase } = require('./supabase');

const fallbackActivity = [];
const MAX_FALLBACK_ACTIVITY = 5000;

async function logActivity({ userId = null, action, method = null, path = null, status = null, metadata = {}, ip = null, userAgent = null } = {}) {
  if (!action) return;
  const row = { user_id: userId || null, action: String(action).slice(0, 120), method, path, status, metadata: metadata && typeof metadata === 'object' ? metadata : {}, ip_address: ip, user_agent: userAgent };
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

async function listActivity({ userId = null, action = null, limit = 100, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const db = getSupabase();
  if (!db) {
    return fallbackActivity.filter((row) => (!userId || row.user_id === userId) && (!action || row.action === action)).slice(safeOffset, safeOffset + safeLimit);
  }
  let query = db.from('activity').select('id,user_id,action,method,path,status,metadata,ip_address,user_agent,created_at').order('created_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1);
  if (userId) query = query.eq('user_id', userId);
  if (action) query = query.eq('action', action);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

module.exports = { logActivity, listActivity };
