const express = require('express');
const {
  findServices, findServiceById, findPosts, addPost, addService, addDonor,
  addBloodRequest, addNotice, addJob, addLostFound, toggleLike,
  getComments, addComment, getDonors, getBloodRequests, getNotices,
  getJobs, getLostFound, searchAll, getOverview, getAdminSummary,
} = require('./store');

const router = express.Router();
const send = (res, data, status = 200) => res.status(status).json({ success: status < 400, data });
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const required = (body, fields) => fields.filter((field) => !body[field] || !String(body[field]).trim());

router.get('/health', (_req, res) => send(res, { status: 'ok', service: 'pirganj-api', apiVersion: 'v1' }));
router.get('/config', (_req, res) => send(res, { app: 'Pirganj', package: 'com.pirganj.app', locale: 'bn-BD' }));
router.get('/overview', asyncRoute(async (_req, res) => send(res, await getOverview())));
router.get('/services', asyncRoute(async (req, res) => send(res, await findServices({ category: req.query.category, search: req.query.search }))));
router.get('/services/:id', asyncRoute(async (req, res) => { const item = await findServiceById(req.params.id); return item ? send(res, item) : send(res, { message: 'Service not found' }, 404); }));
router.post('/services', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['name', 'category']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await addService(req.body), 201); }));
router.get('/posts', asyncRoute(async (req, res) => send(res, await findPosts(req.query.tag))));
router.post('/posts', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['author', 'title', 'body', 'tag']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await addPost(req.body), 201); }));
router.post('/posts/:id/like', asyncRoute(async (req, res) => { const post = await toggleLike(req.params.id); return post ? send(res, post) : send(res, { message: 'Post not found' }, 404); }));
router.get('/posts/:id/comments', asyncRoute(async (req, res) => send(res, await getComments(req.params.id))));
router.post('/posts/:id/comments', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['body']); if (missing.length) return send(res, { message: 'body is required' }, 400); return send(res, await addComment(req.params.id, req.body), 201); }));
router.get('/donors', asyncRoute(async (req, res) => send(res, await getDonors(req.query.group))));
router.post('/donors', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['name', 'bloodGroup', 'phone']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await addDonor(req.body), 201); }));
router.get('/notices', asyncRoute(async (_req, res) => send(res, await getNotices())));
router.post('/notices', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['title']); if (missing.length) return send(res, { message: 'title required' }, 400); return send(res, await addNotice(req.body), 201); }));
router.get('/blood-requests', asyncRoute(async (_req, res) => send(res, await getBloodRequests())));
router.post('/blood-requests', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['patientName', 'bloodGroup', 'hospital', 'phone']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await addBloodRequest(req.body), 201); }));
router.get('/jobs', asyncRoute(async (_req, res) => send(res, await getJobs())));
router.post('/jobs', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['title']); if (missing.length) return send(res, { message: 'title required' }, 400); return send(res, await addJob(req.body), 201); }));
router.get('/lost-found', asyncRoute(async (_req, res) => send(res, await getLostFound())));
router.post('/lost-found', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['title']); if (missing.length) return send(res, { message: 'title required' }, 400); return send(res, await addLostFound(req.body), 201); }));
router.get('/search', asyncRoute(async (req, res) => send(res, await searchAll(req.query.q || ''))));
router.get('/admin/summary', asyncRoute(async (_req, res) => send(res, await getAdminSummary())));

module.exports = router;
