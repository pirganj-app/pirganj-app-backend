const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/server');
const store = require('../src/store');
const { toStoragePath, toPublicUrl, toDatabaseUrl } = require('../src/storage');
const { registerUser, getUserById, deleteUser } = require('../src/auth');

test('store falls back to seed data when Supabase is not configured', async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.equal((await store.findServices({ category: 'হাসপাতাল' })).length, 1);
  assert.equal((await store.findPosts('জরুরি')).length, 1);
});

test('new content is immediately approved in local fallback mode', async () => {
  const post = await store.addPost({ author: 'টেস্টার', title: 'টেস্ট পোস্ট', body: 'কমিউনিটি টেস্ট', tag: 'খবর' });
  const service = await store.addService({ name: 'টেস্ট সেবা', category: 'দোকান' });
  assert.equal(post.status, 'approved');
  assert.equal(service.name, 'টেস্ট সেবা');
});

test('async store exposes overview data', async () => {
  const overview = await store.getOverview();
  assert.ok(Array.isArray(overview.services));
  assert.ok(Array.isArray(overview.posts));
  assert.ok(Array.isArray(overview.donors));
});

test('express app is created with async API router', () => {
  assert.equal(typeof app, 'function');
  assert.ok(app._router);
});

test('storage URLs are exposed without the legacy API segment', () => {
  const legacy = 'https://jhpgickyoauaxersolse.supabase.co/storage/' + 'v' + '1/object/public/pirganj-images/profiles/example.jpg';
  assert.equal(toStoragePath(legacy), 'profiles/example.jpg');
  assert.equal(toPublicUrl(legacy).includes('/' + 'v' + '1/'), false);
  assert.match(toPublicUrl(legacy), /\/api\/media\/profiles\/example\.jpg$/);
  assert.match(toDatabaseUrl('profiles/example.jpg'), /^https?:\/\/.*\/api\/media\/profiles\/example\.jpg$/);
});

test('account deletion removes the fallback user and every owned item', async () => {
  const phone = `017${Date.now().toString().slice(-8)}`;
  const result = await registerUser({ phone, password: 'secret123', name: 'Delete Test', sex: 'পুরুষ', address: 'পীরগঞ্জ', avatarUrl: 'profiles/delete-test.jpg' });
  const userId = result.user.id;
  await store.addPost({ author: 'Delete Test', title: 'Owned post', body: 'Will be deleted', tag: 'খবর', authorId: userId, imageUrl: 'posts/delete-test.jpg' });
  assert.ok(await getUserById(userId));
  assert.equal((await store.getMyItems(userId)).length, 1);
  assert.equal(await deleteUser(userId), true);
  assert.equal(await getUserById(userId), null);
  assert.equal((await store.getMyItems(userId)).length, 0);
  assert.equal(await deleteUser(userId), false);
});
