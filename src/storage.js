const crypto = require('crypto');
const path = require('path');
const { getSupabase } = require('./supabase');

const BUCKET = process.env.SUPABASE_IMAGE_BUCKET || 'pirganj-images';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

async function ensureBucket(db) {
  const listed = await db.storage.listBuckets();
  if (listed.error) throw listed.error;
  if (!(listed.data || []).some((bucket) => bucket.name === BUCKET)) {
    const created = await db.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: `${MAX_IMAGE_BYTES}`,
      allowedMimeTypes: ['image/*'],
    });
    if (created.error && !/already exists/i.test(created.error.message || '')) {
      throw created.error;
    }
  }
}

function extension(mimetype, originalname = '') {
  const fromName = path.extname(originalname).toLowerCase();
  if (/^\.(jpe?g|png|webp|gif|heic)$/.test(fromName)) return fromName;
  return ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/heic': '.heic' })[mimetype] || '.bin';
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
  return { path: filePath, url: db.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl };
}

async function removeImageByUrl(url) {
  const db = getSupabase();
  if (!db || !url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = String(url).indexOf(marker);
  if (index < 0) return;
  const filePath = decodeURIComponent(String(url).slice(index + marker.length).split('?')[0]);
  if (filePath) await db.storage.from(BUCKET).remove([filePath]);
}

module.exports = { BUCKET, MAX_IMAGE_BYTES, uploadImage, removeImageByUrl };
