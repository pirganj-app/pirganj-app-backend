const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/server');
const store = require('../src/store');

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
