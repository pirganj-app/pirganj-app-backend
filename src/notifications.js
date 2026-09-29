const { getSupabase } = require('./supabase');
const { getUsersByIds } = require('./auth');
const { sendPushToUser } = require('./push');
const { toPublicUrl } = require('./storage');

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    actorId: row.actor_id || null,
    actorName: row.actor_name || null,
    actorAvatarUrl: toPublicUrl(row.actor_avatar_url || null),
    entityType: row.entity_type || null,
    entityId: row.entity_id || null,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at || null,
  };
}

async function createNotification({ userId, actorId = null, type, title, body, entityType = null, entityId = null, sendPush = true }) {
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
  }).select('id,user_id,actor_id,type,title,body,entity_type,entity_id,is_read,created_at').single();
  if (error) throw error;
  if (sendPush) {
    try {
      await sendPushToUser(userId, { title, body }, { type, entityType, entityId });
    } catch (pushError) {
      console.error('FCM delivery failed:', pushError.message);
    }
  }
  return mapNotification(data);
}

async function notifyAllUsers({ actorId = null, type, title, body, entityType = null, entityId = null }) {
  const db = getSupabase();
  if (!db) return 0;
  let total = 0;
  for (let offset = 0; ; offset += 1000) {
    const { data: users, error } = await db.from('users').select('id').range(offset, offset + 999);
    if (error) throw error;
    const recipients = (users || []).filter((user) => user.id !== actorId);
    if (recipients.length) {
      const rows = recipients.map((user) => ({ user_id: user.id, actor_id: actorId, type, title, body, entity_type: entityType, entity_id: entityId || null }));
      const { error: insertError } = await db.from('notifications').insert(rows);
      if (insertError) throw insertError;
      total += rows.length;
      // Push delivery is deliberately detached from the request path. In-app
      // notifications are durable even when FCM is slow or temporarily down.
      setImmediate(() => {
        void deliverPushes(recipients, { title, body }, { type, entityType, entityId });
      });
    }
    if (!users || users.length < 1000) break;
  }
  return total;
}

async function deliverPushes(recipients, notification, data) {
  const concurrency = 20;
  for (let offset = 0; offset < recipients.length; offset += concurrency) {
    const batch = recipients.slice(offset, offset + concurrency);
    await Promise.allSettled(batch.map((user) => sendPushToUser(user.id, notification, data)));
  }
}

async function listNotifications(userId, { limit = 50, offset = 0 } = {}) {
  const db = getSupabase();
  if (!db) return [];
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const { data, error } = await db.from('notifications').select('id,user_id,actor_id,type,title,body,entity_type,entity_id,is_read,created_at').eq('user_id', userId).order('created_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1);
  if (error) throw error;
  const actorIds = [...new Set((data || []).map((row) => row.actor_id).filter(Boolean))];
  const actors = await getUsersByIds(actorIds);
  return (data || []).map((row) => {
    const actor = row.actor_id ? actors.get(String(row.actor_id)) : null;
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

async function deleteNotification(id, userId) {
  const db = getSupabase();
  if (!db) return false;
  const { data, error } = await db.from('notifications').delete().eq('id', id).eq('user_id', userId).select('id');
  if (error) throw error;
  return Boolean(data?.length);
}

async function deleteAllNotifications(userId) {
  const db = getSupabase();
  if (!db) return 0;
  const { data, error } = await db.from('notifications').delete().eq('user_id', userId).select('id');
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

async function postIdOfComment(id) {
  const db = getSupabase();
  if (!db || !id) return null;
  const { data, error } = await db.from('comments').select('post_id').eq('id', id).maybeSingle();
  if (error) throw error;
  return data?.post_id || null;
}

module.exports = { createNotification, notifyAllUsers, listNotifications, unreadCount, markNotificationRead, markAllNotificationsRead, deleteNotification, deleteAllNotifications, ownerOf, postIdOfComment };
