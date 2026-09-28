const APP_VERSION = '1.0.0';
const APK_DOWNLOAD_URL = 'https://pirganj-app.netlify.app/apk';
const { getSupabase } = require('./supabase');

async function getVersionPayload() {
  const fallback = { version: APP_VERSION, downloadUrl: APK_DOWNLOAD_URL };
  const db = getSupabase();
  if (!db) return fallback;
  const result = await db.from('app_config').select('key,value').in('key', ['app_version', 'apk_download_url']).limit(2);
  if (result.error) return fallback;
  const values = Object.fromEntries((result.data || []).map((row) => [row.key, row.value]));
  return {
    version: values.app_version || APP_VERSION,
    downloadUrl: values.apk_download_url || APK_DOWNLOAD_URL,
  };
}

module.exports = { APP_VERSION, APK_DOWNLOAD_URL, getVersionPayload };
