const { getSupabase } = require('./supabase');
const { getUserById } = require('./auth');
const { sendPushToUser } = require('./push');

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    actorId: row.actor_id || null,
    actorName: row.actor_name || null,
    actorAvatarUrl: row.actor_avatar_url || null,
    entityType: row.entity_type || null,
    entityId: row.entity_id || null,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at || null,
  };
}

async function createNotification({ userId, actorId = null, type, title, body, entityType = null, entityId = null }) {
  if (!userId || userId === actorId) return null;
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db.from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type,
    title,
    body,
    entity_type: entityType,
    entity_id: entityId || null,
  }).select('*').single();
  if (error) throw error;
  try {
    await sendPushToUser(userId, { title, body }, { type, entityType, entityId });
  } catch (pushError) {
    console.error('FCM delivery failed:', pushError.message);
  }
  return mapNotification(data);
}

async function listNotifications(userId, { limit = 50 } = {}) {
  const db = getSupabase();
  if (!db) return [];
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const { data, error } = await db.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(safeLimit);
  if (error) throw error;
  const actorIds = [...new Set((data || []).map((row) => row.actor_id).filter(Boolean))];
  const actors = new Map(await Promise.all(actorIds.map(async (id) => [id, await getUserById(id)])));
  return (data || []).map((row) => {
    const actor = row.actor_id ? actors.get(row.actor_id) : null;
    return mapNotification({ ...row, actor_name: actor?.name || null, actor_avatar_url: actor?.avatar_url || null });
  });
}

async function unreadCount(userId) {
  const db = getSupabase();
  if (!db) return 0;
  const { count, error } = await db.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
  if (error) throw error;
  return count || 0;
}

async function markNotificationRead(id, userId) {
  const db = getSupabase();
  if (!db) return false;
  const { data, error } = await db.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', userId).select('id').maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function markAllNotificationsRead(userId) {
  const db = getSupabase();
  if (!db) return 0;
  const { data, error } = await db.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false).select('id');
  if (error) throw error;
  return data?.length || 0;
}

async function ownerOf(table, id) {
  const db = getSupabase();
  if (!db || !id) return null;
  const { data, error } = await db.from(table).select('owner_id').eq('id', id).maybeSingle();
  if (error) throw error;
  return data?.owner_id || null;
}

module.exports = { createNotification, listNotifications, unreadCount, markNotificationRead, markAllNotificationsRead, ownerOf };
