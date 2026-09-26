const admin = require('firebase-admin');
const { getSupabase } = require('./supabase');

let initialized = false;
function getFirebase() {
  if (initialized) return admin;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
    return admin;
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error.message);
    return null;
  }
}

async function registerDeviceToken(userId, token, platform = 'android') {
  const db = getSupabase();
  if (!db || !token) return null;
  const { data, error } = await db.from('device_tokens').upsert({
    user_id: userId,
    token,
    platform,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'token' }).select('id,token,platform').single();
  if (error) throw error;
  return data;
}

async function unregisterDeviceToken(userId, token) {
  const db = getSupabase();
  if (!db) return false;
  const query = db.from('device_tokens').delete().eq('user_id', userId);
  if (token) query.eq('token', token);
  const { data, error } = await query.select('id');
  if (error) throw error;
  return Boolean(data?.length);
}

async function sendPushToUser(userId, notification, data = {}) {
  const firebase = getFirebase();
  const db = getSupabase();
  if (!firebase || !db || !userId) return;
  const { data: rows, error } = await db.from('device_tokens').select('token').eq('user_id', userId).limit(20);
  if (error) throw error;
  const tokens = (rows || []).map((row) => row.token).filter(Boolean);
  if (!tokens.length) return;
  const response = await firebase.messaging().sendEachForMulticast({
    tokens,
    notification,
    data: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value ?? '')])),
    android: { priority: 'high', notification: { channelId: 'pirganj_high_importance', sound: 'default' } },
  });
  const invalid = response.responses.map((item, index) => ({ item, token: tokens[index] })).filter(({ item }) => !item.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(item.error?.code)).map(({ token }) => token);
  if (invalid.length) await db.from('device_tokens').delete().in('token', invalid);
}

module.exports = { registerDeviceToken, unregisterDeviceToken, sendPushToUser };
