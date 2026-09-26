const crypto = require('crypto');
const path = require('path');
const { getSupabase } = require('./supabase');
const BUCKET = process.env.SUPABASE_IMAGE_BUCKET || 'pirganj-images';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const PUBLIC_API_URL = (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 10000}`).replace(/\/+$/, '');
const MEDIA_MARKER = '/api/media/';
const STORAGE_MARKERS = [
  `/${['storage', 'v1', 'object', 'public', BUCKET].join('/')}/`,
  `/storage/object/public/${BUCKET}/`,
  MEDIA_MARKER,
];

async function ensureBucket(db) {
  const listed = await db.storage.listBuckets();
  if (listed.error) throw listed.error;
  if (!(listed.data || []).some((bucket) => bucket.name === BUCKET)) {
    const created = await db.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: `${MAX_IMAGE_BYTES}`,
      allowedMimeTypes: ['image/*'],
    });
    if (created.error && !/already exists/i.test(created.error.message || '')) throw created.error;
  }
}

function extension(mimetype, originalname = '') {
  const fromName = path.extname(originalname).toLowerCase();
  if (/^\.(jpe?g|png|webp|gif|heic)$/.test(fromName)) return fromName;
  return ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/heic': '.heic' })[mimetype] || '.bin';
}

function toStoragePath(value) {
  if (value === undefined || value === null || value === '') return value;
  const raw = String(value).trim();
  const marker = STORAGE_MARKERS.find((candidate) => raw.includes(candidate));
  if (marker) return decodeURIComponent(raw.slice(raw.indexOf(marker) + marker.length).split('?')[0]);
  return raw;
}

function toPublicUrl(value) {
  if (value === undefined || value === null || value === '') return value;
  const storagePath = toStoragePath(value);
  if (/^https?:\/\//i.test(storagePath) && !String(value).includes(MEDIA_MARKER)) return storagePath;
  return `${PUBLIC_API_URL}/api/media/${encodeURIComponent(storagePath).replace(/%2F/g, '/')}`;
}

function toDatabaseUrl(value) {
  if (value === undefined || value === null || value === '') return value;
  return toPublicUrl(value);
}

async function uploadImage({ buffer, mimetype, originalname, userId, kind }) {
  if (!buffer || buffer.length === 0) throw Object.assign(new Error('Image is required'), { status: 400 });
  if (buffer.length > MAX_IMAGE_BYTES) throw Object.assign(new Error('Image must be 2MB or smaller'), { status: 413 });
  if (!String(mimetype || '').startsWith('image/')) throw Object.assign(new Error('Only image files are allowed'), { status: 415 });
  const db = getSupabase();
  if (!db) throw Object.assign(new Error('Supabase Storage is not configured'), { status: 503 });
  await ensureBucket(db);
  const filePath = `${kind}/${userId}/${Date.now()}-${crypto.randomUUID()}${extension(mimetype, originalname)}`;
  const result = await db.storage.from(BUCKET).upload(filePath, buffer, { contentType: mimetype, upsert: false, cacheControl: '31536000' });
  if (result.error) throw result.error;
  return { path: filePath, url: toDatabaseUrl(filePath) };
}

async function downloadImage(value) {
  const db = getSupabase();
  if (!db) throw Object.assign(new Error('Supabase Storage is not configured'), { status: 503 });
  const filePath = toStoragePath(value);
  if (!filePath || /^https?:\/\//i.test(filePath)) throw Object.assign(new Error('Invalid image path'), { status: 400 });
  const result = await db.storage.from(BUCKET).download(filePath);
  if (result.error) throw result.error;
  return { buffer: Buffer.from(await result.data.arrayBuffer()), contentType: result.data.type || 'application/octet-stream' };
}

async function removeImageByUrl(url) {
  const db = getSupabase();
  if (!db || !url) return;
  const filePath = toStoragePath(url);
  if (!filePath || /^https?:\/\//i.test(filePath)) return;
  await db.storage.from(BUCKET).remove([filePath]);
}

async function removeImagesByUrls(urls) {
  const db = getSupabase();
  if (!db) return 0;
  const paths = [...new Set((urls || []).map(toStoragePath).filter((value) => value && !/^https?:\/\//i.test(value)))];
  if (!paths.length) return 0;
  const result = await db.storage.from(BUCKET).remove(paths);
  if (result.error) throw result.error;
  return paths.length;
}

async function removeImagesByPrefixes(prefixes) {
  const db = getSupabase();
  if (!db) return 0;
  let removed = 0;
  for (const prefix of [...new Set((prefixes || []).filter(Boolean))]) {
    for (let offset = 0; ; offset += 1000) {
      const listed = await db.storage.from(BUCKET).list(prefix, { limit: 1000, offset });
      if (listed.error) throw listed.error;
      const entries = listed.data || [];
      const paths = entries.filter((item) => item.name).map((item) => `${prefix}/${item.name}`);
      if (paths.length) {
        const result = await db.storage.from(BUCKET).remove(paths);
        if (result.error) throw result.error;
        removed += paths.length;
      }
      if (entries.length < 1000) break;
    }
  }
  return removed;
}

module.exports = { BUCKET, MAX_IMAGE_BYTES, toStoragePath, toPublicUrl, toDatabaseUrl, uploadImage, downloadImage, removeImageByUrl, removeImagesByUrls, removeImagesByPrefixes };
