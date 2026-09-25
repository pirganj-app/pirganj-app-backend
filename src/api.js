const express = require('express');
const {
  findServices, findServiceById, findPosts, addPost, addService, addDonor, addBloodRequest,
  addNotice, addJob, addLostFound, toggleLike, getComments, addComment, getDonors,
  getBloodRequests, getNotices, getJobs, getLostFound, searchAll, getOverview, getAdminSummary,
  getMyItems, updateOwned, deleteOwned, updateComment, deleteComment, toggleReaction, getReactions,
} = require('./store');
const { registerUser, loginUser, getUserById, updateUser, deleteUser, authenticate } = require('./auth');

const router = express.Router();
const send = (res, data, status = 200) => res.status(status).json({ success: status < 400, data });
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const required = (body, fields) => fields.filter((field) => !body[field] || !String(body[field]).trim());
const owner = (handler) => [authenticate, asyncRoute(handler)];

router.get('/health', (_req, res) => send(res, { status: 'ok', service: 'pirganj-api', apiVersion: 'v1' }));
router.get('/config', (_req, res) => send(res, { app: 'Pirganj', package: 'com.pirganj.app', locale: 'bn-BD' }));
router.post('/auth/register', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['phone', 'password', 'name', 'sex', 'address']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await registerUser(req.body), 201); }));
router.post('/auth/login', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['phone', 'password']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await loginUser(req.body)); }));
router.get('/auth/me', ...owner(async (req, res) => { const user = await getUserById(req.user.sub); return user ? send(res, { user: { id: user.id, phone: user.phone, name: user.name, sex: user.sex, address: user.address || '' } }) : send(res, { message: 'User not found' }, 404); }));
router.put('/auth/me', ...owner(async (req, res) => send(res, { user: await updateUser(req.user.sub, req.body || {}) })));
router.delete('/auth/me', ...owner(async (req, res) => { const deleted = await deleteUser(req.user.sub); return deleted ? send(res, { deleted: true }) : send(res, { message: 'User not found' }, 404); }));
router.get('/profile/items', ...owner(async (req, res) => send(res, await getMyItems(req.user.sub))));

router.get('/overview', asyncRoute(async (_req, res) => send(res, await getOverview())));
router.get('/services', asyncRoute(async (req, res) => send(res, await findServices({ category: req.query.category, search: req.query.search }))));
router.get('/services/:id', asyncRoute(async (req, res) => { const item = await findServiceById(req.params.id); return item ? send(res, item) : send(res, { message: 'Service not found' }, 404); }));
router.post('/services', ...owner(async (req, res) => { const missing = required(req.body || {}, ['name', 'category']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await addService(req.body, req.user.sub), 201); }));
router.get('/posts', asyncRoute(async (req, res) => send(res, await findPosts(req.query.tag))));
router.post('/posts', ...owner(async (req, res) => { const missing = required(req.body || {}, ['title', 'body', 'tag']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); const user = await getUserById(req.user.sub); if (!user) return send(res, { message: 'User not found' }, 404); return send(res, await addPost({ ...req.body, authorId: req.user.sub, author: user.name }), 201); }));
router.post('/posts/:id/like', asyncRoute(async (req, res) => { const post = await toggleLike(req.params.id); return post ? send(res, post) : send(res, { message: 'Post not found' }, 404); }));
router.get('/posts/:id/comments', asyncRoute(async (req, res) => send(res, await getComments(req.params.id))));
router.post('/posts/:id/comments', ...owner(async (req, res) => { const missing = required(req.body || {}, ['body']); if (missing.length) return send(res, { message: 'body is required' }, 400); const user = await getUserById(req.user.sub); if (!user) return send(res, { message: 'User not found' }, 404); return send(res, await addComment(req.params.id, { ...req.body, author: user.name, authorId: req.user.sub }), 201); }));
router.put('/comments/:id', ...owner(async (req, res) => { const missing = required(req.body || {}, ['body']); if (missing.length) return send(res, { message: 'body is required' }, 400); const result = await updateComment(req.params.id, req.user.sub, req.body.body); return result ? send(res, result) : send(res, { message: 'Comment not found or you do not own it' }, 404); }));
router.delete('/comments/:id', ...owner(async (req, res) => { const deleted = await deleteComment(req.params.id, req.user.sub); return deleted ? send(res, { deleted: true }) : send(res, { message: 'Comment not found or you do not own it' }, 404); }));
router.post('/posts/:id/reactions', ...owner(async (req, res) => send(res, await toggleReaction(req.params.id, req.user.sub, req.body?.reaction || 'like'))));
router.get('/posts/:id/reactions', asyncRoute(async (req, res) => { const reactions = await getReactions(req.params.id); const enriched = await Promise.all(reactions.map(async (item) => { const user = await getUserById(item.userId || item.user_id); return { ...item, userName: user?.name || item.userId || item.user_id }; })); return send(res, enriched); }));
router.get('/donors', asyncRoute(async (req, res) => send(res, await getDonors(req.query.group))));
router.post('/donors', ...owner(async (req, res) => { const missing = required(req.body || {}, ['name', 'bloodGroup', 'phone']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await addDonor(req.body, req.user.sub), 201); }));
router.get('/notices', asyncRoute(async (_req, res) => send(res, await getNotices())));
router.post('/notices', ...owner(async (req, res) => { const missing = required(req.body || {}, ['title']); if (missing.length) return send(res, { message: 'title required' }, 400); return send(res, await addNotice(req.body, req.user.sub), 201); }));
router.get('/blood-requests', asyncRoute(async (req, res) => send(res, await getBloodRequests(req.query.group))));
router.post('/blood-requests', ...owner(async (req, res) => { const missing = required(req.body || {}, ['patientName', 'bloodGroup', 'hospital', 'phone']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await addBloodRequest(req.body, req.user.sub), 201); }));
router.get('/jobs', asyncRoute(async (_req, res) => send(res, await getJobs())));
router.post('/jobs', ...owner(async (req, res) => { const missing = required(req.body || {}, ['title']); if (missing.length) return send(res, { message: 'title required' }, 400); return send(res, await addJob(req.body, req.user.sub), 201); }));
router.get('/lost-found', asyncRoute(async (_req, res) => send(res, await getLostFound())));
router.post('/lost-found', ...owner(async (req, res) => { const missing = required(req.body || {}, ['title']); if (missing.length) return send(res, { message: 'title required' }, 400); return send(res, await addLostFound(req.body, req.user.sub), 201); }));
router.get('/search', asyncRoute(async (req, res) => send(res, await searchAll(req.query.q || ''))));
router.get('/admin/summary', asyncRoute(async (_req, res) => send(res, await getAdminSummary())));

router.put('/profile/items/:resource/:id', ...owner(async (req, res) => { const result = await updateOwned(req.params.resource, req.params.id, req.user.sub, req.body || {}); return result ? send(res, result) : send(res, { message: 'Item not found or you do not own it' }, 404); }));
router.delete('/profile/items/:resource/:id', ...owner(async (req, res) => { const deleted = await deleteOwned(req.params.resource, req.params.id, req.user.sub); return deleted ? send(res, { deleted: true }) : send(res, { message: 'Item not found or you do not own it' }, 404); }));

module.exports = router;
