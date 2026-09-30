const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {
  findServices, findServiceById, findPosts, findPostById, addPost, addService, addDonor, addBloodRequest,
  addNotice, addJob, addLostFound, toggleLike, getComments, addComment, getDonors,
  getBloodRequests, getNotices, getJobs, getLostFound, searchAll, getOverview, getAdminSummary,
  getMyItems, getPublicProfile, updateOwned, deleteOwned, updateComment, deleteComment, toggleReaction, getReactions, getCommentReactions, toggleCommentReaction,
} = require('./store');
const { registerUser, loginUser, loginWithGoogle, completeGoogleRegistration, getUserById, getUsersByIds, updateUser, deleteUser, authenticate, optionalAuthenticate, publicUser } = require('./auth');
const { MAX_IMAGE_BYTES, uploadImage, createSignedUpload, downloadImage, toPublicUrl } = require('./storage');
const { createNotification, notifyAllUsers, listNotifications, unreadCount, markNotificationRead, markAllNotificationsRead, deleteNotification, deleteAllNotifications, ownerOf, postIdOfComment } = require('./notifications');
const { registerDeviceToken, unregisterDeviceToken } = require('./push');
const { getSupabase } = require('./supabase');
const { getVersionPayload } = require('./config');
const { logActivity } = require('./activity');
const { adminLogin, authenticateAdmin, listUsers, setUserBlocked, deleteAdminUser, listDevices, unblockDevice, listActivity, deleteAdminActivity, sendMessage } = require('./admin');

const router = express.Router();
const PAGE_NAMES = new Set(['হোম', 'কমিউনিটি', 'প্রোফাইল', 'যোগ করুন', 'হাসপাতাল', 'ক্লিনিক', 'ফার্মেসি', 'রেস্টুরেন্ট', 'হোটেল', 'সরকারি অফিস', 'অ্যাম্বুলেন্স', 'গাড়ি ভাড়া', 'সার্চ']);
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
const enrichReactions = async (reactions) => {
  const users = await getUsersByIds((reactions || []).map((item) => item.userId || item.user_id));
  return (reactions || []).map((item) => {
    const id = item.userId || item.user_id;
    const user = users.get(String(id));
    return { ...item, userName: user?.name || id, userAvatarUrl: toPublicUrl(user?.avatar_url || null) };
  });
};
const broadcastNewContent = async ({ actorId, type, title, body, entityType, entityId }) => {
  if (!['post', 'blood-request', 'notice', 'lost-found'].includes(entityType)) return 0;
  try {
    // Persist in-app notifications before returning the create response. Push
    // delivery remains detached inside notifyAllUsers, so FCM cannot slow writes.
    return await notifyAllUsers({ actorId, type, title, body, entityType, entityId });
  } catch (error) {
    // Content creation must not fail because notification delivery is degraded.
    console.error('Notification fan-out failed:', error.message);
    return 0;
  }
};

router.get('/health', (_req, res) => send(res, { status: 'ok', service: 'pirganj-api', apiVersion: '1.0' }));
router.get('/version', asyncRoute(async (_req, res) => send(res, await getVersionPayload())));
router.get('/config', (_req, res) => send(res, { app: 'Pirganj', package: 'com.pirganj.app', locale: 'bn-BD' }));
router.get('/app-open-message', asyncRoute(async (_req, res) => {
  const db = getSupabase();
  if (!db) return send(res, { visible: false });
  const { data, error } = await db.from('apponenmsg').select('id,title,html_content,visible,updated_at').eq('visible', true).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return send(res, data ? { visible: true, id: data.id, title: data.title, html: data.html_content, updatedAt: data.updated_at } : { visible: false });
}));
router.get('/about', asyncRoute(async (_req, res) => {
  const file = path.join(__dirname, '..', 'about.html');
  const html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  return send(res, { html });
}));
router.get('/users/:id/public', asyncRoute(async (req, res) => {
  const profile = await getPublicProfile(req.params.id);
  return profile ? send(res, profile) : send(res, { message: 'Profile not found' }, 404);
}));
router.post('/activity/page', ...owner(async (req, res) => {
  const pageName = String(req.body?.pageName || '').trim();
  if (!PAGE_NAMES.has(pageName)) return send(res, { message: 'Page name is not allowed' }, 400);
  void logActivity({ userId: req.user.sub, action: pageName, ip: req.ip });
  return send(res, { recorded: true });
}));
router.get('/media/*', asyncRoute(async (req, res) => { const image = await downloadImage(req.params[0]); res.set('Cache-Control', 'public, max-age=31536000, immutable'); res.type(image.contentType); return res.send(image.buffer); }));
router.post('/auth/register', parseImage('profileImage'), asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['email', 'phone', 'password', 'name', 'sex', 'address']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); const uploaded = await uploadImage({ buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname, userId: `signup-${Date.now()}`, kind: 'profiles' }); const result = await registerUser({ ...req.body, avatarUrl: uploaded.url }); return send(res, result, 201); }));
  router.post('/auth/login', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['email', 'password']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); const result = await loginUser({ ...req.body, deviceId: req.headers['x-device-id'] }); void logActivity({ userId: result.user?.id, action: 'successfully_login', ip: req.ip }); return send(res, result); }));
  router.post('/auth/google', asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['accessToken']); if (missing.length) return send(res, { message: 'accessToken required' }, 400); const result = await loginWithGoogle(req.body.accessToken); void logActivity({ userId: result.user?.id, action: 'successfully_login', ip: req.ip }); return send(res, result); }));
router.post('/auth/google/register', imageUpload.single('profileImage'), asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['accessToken', 'phone', 'password', 'name', 'sex', 'address']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); let avatarUrl; if (req.file) avatarUrl = (await uploadImage({ buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname, userId: `google-signup-${Date.now()}`, kind: 'profiles' })).url; return send(res, await completeGoogleRegistration({ ...req.body, avatarUrl }), 201); }));
  router.get('/auth/me', ...owner(async (req, res) => { const user = await getUserById(req.user.sub); return user ? send(res, { user: publicUser(user) }) : send(res, { message: 'User not found' }, 404); }));
  router.post('/auth/logout', ...owner(async (req, res) => { void logActivity({ userId: req.user.sub, action: 'logout', ip: req.ip }); return send(res, { loggedOut: true }); }));
router.put('/auth/me', ...owner(async (req, res) => send(res, { user: await updateUser(req.user.sub, req.body || {}) })));
router.delete('/auth/me', ...owner(async (req, res) => { const deleted = await deleteUser(req.user.sub); return deleted ? send(res, { deleted: true }) : send(res, { message: 'User not found' }, 404); }));
router.post('/uploads/image', authenticate, parseImage('image'), asyncRoute(async (req, res) => send(res, await uploadImage({ buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname, userId: req.user.sub, kind: req.body?.kind === 'post' ? 'posts' : req.body?.kind === 'lost_found' ? 'lost_found' : 'profiles' }), 201)));
router.post('/uploads/signed', ...owner(async (req, res) => {
  const missing = required(req.body || {}, ['mimeType']);
  if (missing.length) return send(res, { message: 'mimeType required' }, 400);
  return send(res, await createSignedUpload({
    mimetype: req.body.mimeType,
    originalname: req.body.fileName || 'upload.jpg',
    userId: req.user.sub,
    kind: req.body.kind === 'post' ? 'posts' : req.body.kind === 'lost_found' ? 'lost_found' : 'profiles',
  }), 201);
}));
router.post('/devices/push-token', ...owner(async (req, res) => { const missing = required(req.body || {}, ['token']); if (missing.length) return send(res, { message: 'token required' }, 400); return send(res, await registerDeviceToken(req.user.sub, req.body.token, req.body.platform || 'android'), 201); }));
router.delete('/devices/push-token', ...owner(async (req, res) => send(res, { deleted: await unregisterDeviceToken(req.user.sub, req.body?.token) })));
router.get('/notifications', ...owner(async (req, res) => send(res, await listNotifications(req.user.sub, { limit: req.query.limit, offset: req.query.offset }))));
router.get('/notifications/unread-count', ...owner(async (req, res) => send(res, { count: await unreadCount(req.user.sub) })));
router.put('/notifications/:id/read', ...owner(async (req, res) => send(res, { updated: await markNotificationRead(req.params.id, req.user.sub) })));
router.put('/notifications/read-all', ...owner(async (req, res) => send(res, { updated: await markAllNotificationsRead(req.user.sub) })));
router.delete('/notifications/:id', ...owner(async (req, res) => send(res, { deleted: await deleteNotification(req.params.id, req.user.sub) })));
router.delete('/notifications', ...owner(async (req, res) => send(res, { deleted: await deleteAllNotifications(req.user.sub) })));
router.get('/profile/items', ...owner(async (req, res) => send(res, await getMyItems(req.user.sub, { limit: req.query.limit, offset: req.query.offset, resource: req.query.resource }))));

router.get('/overview', asyncRoute(async (_req, res) => send(res, await getOverview())));
router.get('/services', asyncRoute(async (req, res) => send(res, await findServices({ category: req.query.category, search: req.query.search, limit: req.query.limit, offset: req.query.offset }))));
router.get('/services/:id', asyncRoute(async (req, res) => { const item = await findServiceById(req.params.id); return item ? send(res, item) : send(res, { message: 'Service not found' }, 404); }));
router.post('/services', ...owner(async (req, res) => { const missing = required(req.body || {}, ['name', 'category']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); const item = await addService(req.body, req.user.sub); await broadcastNewContent({ actorId: req.user.sub, type: 'new_service', title: 'নতুন স্থানীয় সেবা', body: `${req.body.name} নতুন সেবা হিসেবে যুক্ত হয়েছে`, entityType: 'service', entityId: item.id }); return send(res, item, 201); }));
router.get('/posts', optionalAuthenticate, asyncRoute(async (req, res) => send(res, await findPosts(req.query.tag, req.user?.sub, { limit: req.query.limit, offset: req.query.offset, before: req.query.before }))));
router.get('/posts/:id', optionalAuthenticate, asyncRoute(async (req, res) => { const post = await findPostById(req.params.id, req.user?.sub); return post ? send(res, post) : send(res, { message: 'Post not found' }, 404); }));
router.post('/posts', ...owner(async (req, res) => { const missing = required(req.body || {}, ['title', 'body', 'tag']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); const user = await getUserById(req.user.sub); if (!user) return send(res, { message: 'User not found' }, 404); const item = await addPost({ ...req.body, authorId: req.user.sub, author: user.name }); await broadcastNewContent({ actorId: req.user.sub, type: 'new_post', title: 'নতুন পোস্ট', body: `${user.name} নতুন একটি পোস্ট করেছেন`, entityType: 'post', entityId: item.id }); return send(res, item, 201); }));
router.post('/posts/:id/like', asyncRoute(async (req, res) => { const post = await toggleLike(req.params.id); return post ? send(res, post) : send(res, { message: 'Post not found' }, 404); }));
router.get('/posts/:id/comments', asyncRoute(async (req, res) => send(res, await getComments(req.params.id, { limit: req.query.limit, offset: req.query.offset }))));
router.post('/posts/:id/comments', ...owner(async (req, res) => { const missing = required(req.body || {}, ['body']); if (missing.length) return send(res, { message: 'body is required' }, 400); const user = await getUserById(req.user.sub); if (!user) return send(res, { message: 'User not found' }, 404); const comment = await addComment(req.params.id, { ...req.body, author: user.name, authorId: req.user.sub }); const postOwner = await ownerOf('posts', req.params.id); await createNotification({ userId: postOwner, actorId: req.user.sub, type: 'comment', title: 'নতুন মন্তব্য', body: `${user.name} আপনার পোস্টে মন্তব্য করেছেন`, entityType: 'post', entityId: req.params.id }); if (req.body.parentId) { const parentOwner = await ownerOf('comments', req.body.parentId); const parentPostId = await postIdOfComment(req.body.parentId); await createNotification({ userId: parentOwner, actorId: req.user.sub, type: 'reply', title: 'আপনার মন্তব্যে reply এসেছে', body: `${user.name} আপনার মন্তব্যের উত্তর দিয়েছেন`, entityType: 'post', entityId: parentPostId || req.params.id }); } return send(res, comment, 201); }));
router.put('/comments/:id', ...owner(async (req, res) => { const missing = required(req.body || {}, ['body']); if (missing.length) return send(res, { message: 'body is required' }, 400); const result = await updateComment(req.params.id, req.user.sub, req.body.body); return result ? send(res, result) : send(res, { message: 'Comment not found or you do not own it' }, 404); }));
router.delete('/comments/:id', ...owner(async (req, res) => { const deleted = await deleteComment(req.params.id, req.user.sub); return deleted ? send(res, { deleted: true }) : send(res, { message: 'Comment not found or you do not own it' }, 404); }));
router.post('/posts/:id/reactions', ...owner(async (req, res) => { const reaction = req.body?.reaction || 'like'; const result = await toggleReaction(req.params.id, req.user.sub, reaction); if (result.change === 'added') { const user = await getUserById(req.user.sub); const postOwner = await ownerOf('posts', req.params.id); await createNotification({ userId: postOwner, actorId: req.user.sub, type: 'reaction', title: 'নতুন reaction', body: `${user?.name || 'কেউ'} আপনার পোস্টে ${reaction} reaction দিয়েছেন`, entityType: 'post', entityId: req.params.id }); } return send(res, await enrichReactions(result.reactions)); }));
router.get('/posts/:id/reactions', asyncRoute(async (req, res) => send(res, await enrichReactions(await getReactions(req.params.id)))));
router.post('/comments/:id/reactions', ...owner(async (req, res) => { const reaction = req.body?.reaction || 'like'; const result = await toggleCommentReaction(req.params.id, req.user.sub, reaction); if (result.change === 'added') { const user = await getUserById(req.user.sub); const commentOwner = await ownerOf('comments', req.params.id); const postId = await postIdOfComment(req.params.id); await createNotification({ userId: commentOwner, actorId: req.user.sub, type: 'reaction', title: 'মন্তব্যে reaction', body: `${user?.name || 'কেউ'} আপনার মন্তব্যে ${reaction} reaction দিয়েছেন`, entityType: 'post', entityId: postId }); } return send(res, await enrichReactions(result.reactions)); }));
router.get('/comments/:id/reactions', asyncRoute(async (req, res) => send(res, await enrichReactions(await getCommentReactions(req.params.id)))));
router.get('/donors', asyncRoute(async (req, res) => send(res, await getDonors(req.query.group, { limit: req.query.limit, offset: req.query.offset }))));
router.post('/donors', ...owner(async (req, res) => { const missing = required(req.body || {}, ['name', 'bloodGroup', 'phone']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); const item = await addDonor(req.body, req.user.sub); await broadcastNewContent({ actorId: req.user.sub, type: 'new_donor', title: 'নতুন রক্তদাতা', body: `${req.body.name} নতুন রক্তদাতা হিসেবে যুক্ত হয়েছেন`, entityType: 'donor', entityId: item.id }); return send(res, item, 201); }));
router.get('/notices', asyncRoute(async (req, res) => send(res, await getNotices({ limit: req.query.limit, offset: req.query.offset }))));
router.post('/notices', ...owner(async (req, res) => { const missing = required(req.body || {}, ['title']); if (missing.length) return send(res, { message: 'title required' }, 400); const item = await addNotice(req.body, req.user.sub); await broadcastNewContent({ actorId: req.user.sub, type: 'new_notice', title: 'নতুন নোটিশ', body: req.body.title, entityType: 'notice', entityId: item.id }); return send(res, item, 201); }));
router.get('/blood-requests', asyncRoute(async (req, res) => send(res, await getBloodRequests(req.query.group, { limit: req.query.limit, offset: req.query.offset }))));
router.post('/blood-requests', ...owner(async (req, res) => { const missing = required(req.body || {}, ['patientName', 'bloodGroup', 'hospital', 'phone']); if (missing.length) return send(res, { message: `${missing.join(', ')} required` }, 400); const item = await addBloodRequest(req.body, req.user.sub); await broadcastNewContent({ actorId: req.user.sub, type: 'new_blood_request', title: 'জরুরি রক্তের অনুরোধ', body: `${req.body.bloodGroup} রক্ত প্রয়োজন — ${req.body.hospital}`, entityType: 'blood-request', entityId: item.id }); return send(res, item, 201); }));
router.get('/jobs', asyncRoute(async (req, res) => send(res, await getJobs({ limit: req.query.limit, offset: req.query.offset }))));
router.post('/jobs', ...owner(async (req, res) => { const missing = required(req.body || {}, ['title']); if (missing.length) return send(res, { message: 'title required' }, 400); const item = await addJob(req.body, req.user.sub); await broadcastNewContent({ actorId: req.user.sub, type: 'new_job', title: 'নতুন চাকরির খবর', body: req.body.title, entityType: 'job', entityId: item.id }); return send(res, item, 201); }));
router.get('/lost-found', asyncRoute(async (req, res) => send(res, await getLostFound({ limit: req.query.limit, offset: req.query.offset }))));
router.post('/lost-found', ...owner(async (req, res) => { const missing = required(req.body || {}, ['title']); if (missing.length) return send(res, { message: 'title required' }, 400); const item = await addLostFound(req.body, req.user.sub); await broadcastNewContent({ actorId: req.user.sub, type: 'new_lost_found', title: 'নতুন হারানো/পাওয়া তথ্য', body: req.body.title, entityType: 'lost-found', entityId: item.id }); return send(res, item, 201); }));
router.get('/search', asyncRoute(async (req, res) => send(res, await searchAll(req.query.q || ''))));
router.get('/admin/summary', asyncRoute(async (_req, res) => send(res, await getAdminSummary())));

router.post('/admin/login', asyncRoute(async (req, res) => {
  const result = adminLogin(req.body?.username, req.body?.password);
  void logActivity({ action: 'admin_login', method: req.method, path: req.path, status: 200, ip: req.ip, userAgent: req.get('user-agent') });
  return send(res, result);
}));
router.get('/admin/session', authenticateAdmin, (_req, res) => send(res, { authenticated: true }));
  router.get('/admin/users', authenticateAdmin, asyncRoute(async (req, res) => send(res, await listUsers({ limit: req.query.limit, offset: req.query.offset, name: req.query.name, email: req.query.email, phone: req.query.phone }))));
  router.put('/admin/users/:id/block', authenticateAdmin, asyncRoute(async (req, res) => send(res, await setUserBlocked(req.params.id, req.body?.blocked === true))));
  router.delete('/admin/users/:id', authenticateAdmin, asyncRoute(async (req, res) => send(res, await deleteAdminUser(req.params.id))));
router.get('/admin/devices', authenticateAdmin, asyncRoute(async (req, res) => send(res, await listDevices({ limit: req.query.limit, offset: req.query.offset }))));
router.put('/admin/devices/:id/unblock', authenticateAdmin, asyncRoute(async (req, res) => send(res, await unblockDevice(req.params.id))));
  router.get('/admin/activity', authenticateAdmin, asyncRoute(async (req, res) => send(res, await listActivity({ userId: req.query.userId, period: req.query.period, limit: req.query.limit, offset: req.query.offset }))));
  router.delete('/admin/activity', authenticateAdmin, asyncRoute(async (req, res) => send(res, await deleteAdminActivity({ userId: req.query.userId, period: req.query.period }))));
router.post('/admin/messages', authenticateAdmin, asyncRoute(async (req, res) => { const missing = required(req.body || {}, ['title', 'body']); if (missing.length) return send(res, { message: 'শিরোনাম ও বার্তা লিখুন' }, 400); const result = await sendMessage({ userId: req.body.userId || null, title: String(req.body.title).trim(), body: String(req.body.body).trim() }); void logActivity({ action: 'admin_send_message', method: req.method, path: req.path, status: 201, metadata: { userId: req.body.userId || 'all' } }); return send(res, result, 201); }));

router.put('/profile/items/:resource/:id', ...owner(async (req, res) => { const result = await updateOwned(req.params.resource, req.params.id, req.user.sub, req.body || {}); return result ? send(res, result) : send(res, { message: 'Item not found or you do not own it' }, 404); }));
router.delete('/profile/items/:resource/:id', ...owner(async (req, res) => { const deleted = await deleteOwned(req.params.resource, req.params.id, req.user.sub); return deleted ? send(res, { deleted: true }) : send(res, { message: 'Item not found or you do not own it' }, 404); }));

module.exports = router;
