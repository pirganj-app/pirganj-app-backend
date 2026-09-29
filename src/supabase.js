const { createClient } = require('@supabase/supabase-js');

let cachedClient = null;
let cachedConfig = '';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const configKey = `${url}\n${key}`;
  if (!cachedClient || cachedConfig !== configKey) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    cachedConfig = configKey;
  }
  return cachedClient;
}

module.exports = { getSupabase };
