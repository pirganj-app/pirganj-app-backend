const express = require('express');
const multer = require('multer');
const {
  findServices, findServiceById, findPosts, addPost, addService, addDonor, addBloodRequest,
  addNotice, addJob, addLostFound, toggleLike, getComments, addComment, getDonors,
  getBloodRequests, getNotices, getJobs, getLostFound, searchAll, getOverview, getAdminSummary,
  getMyItems, updateOwned, deleteOwned, updateComment, deleteComment, toggleReaction, getReactions, getCommentReactions, toggleCommentReaction,
} = require('./store');
const { registerUser, loginUser, getUserById, updateUser, deleteUser, authenticate, optionalAuthenticate } = require('./auth');
const { MAX_IMAGE_BYTES, uploadImage } = require('./storage');

const router = express.Router();
const send = (res, data, status = 200) => res.status(status).json({ success: status < 400, data });
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const required = (body, fields) => fields.filter((field) => !body[field] || !String(body[field]).trim());
const owner = (handler) => [authenticate, asyncRoute(handler)];
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, callback) => callback(null, String(file.mimetype || '').startsWith('image/')),
});
const parseImage = (field) => (req, res, next) => imageUpload.single(field)(req, res, (error) => {
  if (error) {
    error.status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return next(error);
  }
  if (!req.file) return res.status(400).json({ success: false, data: { message: 'Profile picture is required' } });
  return next();
});
const enrichReactions = async (reactions) => Promise.all(reactions.map(async (item) => { const user = await getUserById(item.userId || item.user_id); return { ...item, userName: user?.name || item.userId || item.user_id, userAvatarUrl: user?.avatar_url || null }; }));

router.get('/health', (_req, res) => send(res, { status: 'ok', service: 'pirganj-api', apiVersion: 'v1' }));
router.get('/config', (_req, res) => send(res, { app: 'Pirganj', package: 'com.pirganj.app', locale: 'bn-BD' }));
router.post('/auth/register', parseImage('profileImage'), asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['phone', 'password', 'name', 'sex', 'address']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); const uploaded = await uploadImage({ buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname, userId: `signup-${Date.now()}`, kind: 'profiles' }); return send(res, await registerUser({ ...req.body, avatarUrl: uploaded.url }), 201); }));
router.post('/auth/login', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['phone', 'password']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await loginUser(req.body)); }));
router.get('/auth/me', ...owner(async (req, res) => { const user = await getUserById(req.user.sub); return user ? send(res, { user: { id: user.id, phone: user.phone, name: user.name, sex: user.sex, address: user.address || '', avatarUrl: user.avatar_url || null } }) : send(res, { message: 'User not found' }, 404); }));
router.put('/auth/me', ...owner(async (req, res) => send(res, { user: await updateUser(req.user.sub, req.body || {}) })));
router.delete('/auth/me', ...owner(async (req, res) => { const deleted = await deleteUser(req.user.sub); return deleted ? send(res, { deleted: true }) : send(res, { message: 'User not found' }, 404); }));
router.post('/uploads/image', authenticate, parseImage('image'), asyncRoute(async (req, res) => send(res, await uploadImage({ buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname, userId: req.user.sub, kind: req.body?.kind === 'post' ? 'posts' : 'profiles' }), 201)));
router.get('/profile/items', ...owner(async (req, res) => send(res, await getMyItems(req.user.sub))));

router.get('/overview', asyncRoute(async (_req, res) => send(res, await getOverview())));
router.get('/services', asyncRoute(async (req, res) => send(res, await findServices({ category: req.query.category, search: req.query.search }))));
router.get('/services/:id', asyncRoute(async (req, res) => { const item = await findServiceById(req.params.id); return item ? send(res, item) : send(res, { message: 'Service not found' }, 404); }));
router.post('/services', ...owner(async (req, res) => { const missing = required(req.body || {}, ['name', 'category']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); return send(res, await addService(req.body, req.user.sub), 201); }));
router.get('/posts', optionalAuthenticate, asyncRoute(async (req, res) => send(res, await findPosts(req.query.tag, req.user?.sub))));
router.post('/posts', ...owner(async (req, res) => { const missing = required(req.body || {}, ['title', 'body', 'tag']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); const user = await getUserById(req.user.sub); if (!user) return send(res, { message: 'User not found' }, 404); return send(res, await addPost({ ...req.body, authorId: req.user.sub, author: user.name }), 201); }));
router.post('/posts/:id/like', asyncRoute(async (req, res) => { const post = await toggleLike(req.params.id); return post ? send(res, post) : send(res, { message: 'Post not found' }, 404); }));
router.get('/posts/:id/comments', asyncRoute(async (req, res) => send(res, await getComments(req.params.id))));
router.post('/posts/:id/comments', ...owner(async (req, res) => { const missing = required(req.body || {}, ['body']); if (missing.length) return send(res, { message: 'body is required' }, 400); const user = await getUserById(req.user.sub); if (!user) return send(res, { message: 'User not found' }, 404); return send(res, await addComment(req.params.id, { ...req.body, author: user.name, authorId: req.user.sub }), 201); }));
router.put('/comments/:id', ...owner(async (req, res) => { const missing = required(req.body || {}, ['body']); if (missing.length) return send(res, { message: 'body is required' }, 400); const result = await updateComment(req.params.id, req.user.sub, req.body.body); return result ? send(res, result) : send(res, { message: 'Comment not found or you do not own it' }, 404); }));
router.delete('/comments/:id', ...owner(async (req, res) => { const deleted = await deleteComment(req.params.id, req.user.sub); return deleted ? send(res, { deleted: true }) : send(res, { message: 'Comment not found or you do not own it' }, 404); }));
router.post('/posts/:id/reactions', ...owner(async (req, res) => send(res, await enrichReactions(await toggleReaction(req.params.id, req.user.sub, req.body?.reaction || 'like')))));
router.get('/posts/:id/reactions', asyncRoute(async (req, res) => send(res, await enrichReactions(await getReactions(req.params.id)))));
router.post('/comments/:id/reactions', ...owner(async (req, res) => send(res, await enrichReactions(await toggleCommentReaction(req.params.id, req.user.sub, req.body?.reaction || 'like')))));
router.get('/comments/:id/reactions', asyncRoute(async (req, res) => send(res, await enrichReactions(await getCommentReactions(req.params.id)))));
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
