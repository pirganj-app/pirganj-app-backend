const express = require('express');
const {
  findServices, findServiceById, findPosts, addPost, toggleLike,
  getComments, addComment, getDonors, getBloodRequests, getNotices,
  getJobs, getLostFound, searchAll, getOverview, getAdminSummary,
} = require('./store');

const router = express.Router();
const send = (res, data, status = 200) => res.status(status).json({ success: status < 400, data });
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.get('/health', (_req, res) => send(res, { status: 'ok', service: 'pirganj-api', apiVersion: 'v1' }));
router.get('/config', (_req, res) => send(res, { app: 'Pirganj', package: 'com.pirganj.app', locale: 'bn-BD' }));
router.get('/overview', asyncRoute(async (_req, res) => send(res, await getOverview())));
router.get('/services', asyncRoute(async (req, res) => send(res, await findServices({ category: req.query.category, search: req.query.search }))));
router.get('/services/:id', asyncRoute(async (req, res) => { const item = await findServiceById(req.params.id); return item ? send(res, item) : send(res, { message: 'Service not found' }, 404); }));
router.get('/posts', asyncRoute(async (req, res) => send(res, await findPosts(req.query.tag))));
router.post('/posts', asyncRoute(async (req, res) => { const { author, title, body, tag, authorId } = req.body || {}; if (!author || !title || !body || !tag) return send(res, { message: 'author, title, body and tag are required' }, 400); return send(res, await addPost({ author, title, body, tag, authorId }), 201); }));
router.post('/posts/:id/like', asyncRoute(async (req, res) => { const post = await toggleLike(req.params.id); return post ? send(res, post) : send(res, { message: 'Post not found' }, 404); }));
router.get('/posts/:id/comments', asyncRoute(async (req, res) => send(res, await getComments(req.params.id))));
router.post('/posts/:id/comments', asyncRoute(async (req, res) => { const { author, authorId, body } = req.body || {}; if (!body || !String(body).trim()) return send(res, { message: 'body is required' }, 400); return send(res, await addComment(req.params.id, { author, authorId, body: String(body).trim() }), 201); }));
router.get('/donors', asyncRoute(async (req, res) => send(res, await getDonors(req.query.group))));
router.get('/notices', asyncRoute(async (_req, res) => send(res, await getNotices())));
router.get('/blood-requests', asyncRoute(async (_req, res) => send(res, await getBloodRequests())));
router.get('/jobs', asyncRoute(async (_req, res) => send(res, await getJobs())));
router.get('/lost-found', asyncRoute(async (_req, res) => send(res, await getLostFound())));
router.get('/search', asyncRoute(async (req, res) => send(res, await searchAll(req.query.q || ''))));
router.get('/admin/summary', asyncRoute(async (_req, res) => send(res, await getAdminSummary())));

module.exports = router;
