const express = require('express');
const { services, posts, donors, notices, findServices, findPosts, addPost, toggleLike } = require('./store');
const router = express.Router();
const send = (res, data, status = 200) => res.status(status).json({ success: status < 400, data });

router.get('/health', (_req, res) => send(res, { status: 'ok', service: 'pirganj-api', apiVersion: 'v1' }));
router.get('/config', (_req, res) => send(res, { app: 'Pirganj', package: 'com.pirganj.app', locale: 'bn-BD' }));
router.get('/overview', (_req, res) => send(res, { services, posts, donors, notices }));
router.get('/services', (req, res) => send(res, findServices({ category: req.query.category, search: req.query.search })));
router.get('/services/:id', (req, res) => { const item = services.find((service) => service.id === req.params.id); return item ? send(res, item) : send(res, { message: 'Service not found' }, 404); });
router.get('/posts', (req, res) => send(res, findPosts(req.query.tag)));
router.post('/posts', (req, res) => { const { author, title, body, tag } = req.body || {}; if (!author || !title || !body || !tag) return send(res, { message: 'author, title, body and tag are required' }, 400); return send(res, addPost({ author, title, body, tag }), 201); });
router.post('/posts/:id/like', (req, res) => { const post = toggleLike(req.params.id); return post ? send(res, post) : send(res, { message: 'Post not found' }, 404); });
router.get('/donors', (req, res) => send(res, donors.filter((donor) => !req.query.group || donor.group === req.query.group)));
router.get('/notices', (_req, res) => send(res, notices));
router.get('/blood-requests', (_req, res) => send(res, posts.filter((post) => post.tag === 'জরুরি')));
router.get('/jobs', (_req, res) => send(res, posts.filter((post) => post.tag === 'চাকরি')));
router.get('/lost-found', (_req, res) => send(res, posts.filter((post) => post.tag === 'হারানো/পাওয়া')));
router.get('/search', (req, res) => { const q = String(req.query.q || '').toLowerCase(); return send(res, { services: findServices({ search: q }), posts: posts.filter((post) => `${post.title} ${post.body}`.toLowerCase().includes(q)) }); });
router.get('/admin/summary', (_req, res) => send(res, { pending: posts.length, members: 1284, reports: 3, services: services.length }));

module.exports = router;
