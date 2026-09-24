const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/server');

function request(path, options = {}) {
  return fetch(`http://127.0.0.1:0${path}`, options);
}

test('store exposes service and post fixtures', () => {
  const store = require('../src/store');
  assert.equal(store.findServices({ category: 'হাসপাতাল' }).length, 1);
  assert.equal(store.findPosts('জরুরি').length, 1);
});

test('express app is created with API router', () => {
  assert.equal(typeof app, 'function');
  assert.ok(app._router);
});
