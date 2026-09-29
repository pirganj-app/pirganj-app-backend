const { getSupabase } = require('./supabase');
const { rememberFallbackItem, getFallbackItem, deleteFallbackItem, getUserById, getUsersByIds } = require('./auth');
const { removeImageByUrl, toStoragePath, toPublicUrl, toDatabaseUrl } = require('./storage');

const seedServices = [
  { id: 'd1', name: 'পীরগঞ্জ উপজেলা স্বাস্থ্য কমপ্লেক্স', category: 'হাসপাতাল', meta: '২৪ ঘণ্টা জরুরি সেবা', location: 'পীরগঞ্জ সদর, ঠাকুরগাঁও', phone: '০৫৬২২-৫৬০০১', open: 'এখন খোলা', icon: '＋' },
  { id: 'd2', name: 'মা ফার্মেসি', category: 'ফার্মেসি', meta: 'লাইসেন্সধারী ফার্মেসি', location: 'কলেজ রোড, পীরগঞ্জ', phone: '০১৭১২-৩৪৫৬৭৮', open: 'সকাল ৮টা–রাত ১১টা', icon: '✚' },
];
const seedPosts = [
  { id: 'p1', author: 'তানভীর আহমেদ', tag: 'জরুরি', title: 'O+ রক্ত প্রয়োজন — দ্রুত সহায়তা চাই', body: 'পীরগঞ্জ স্বাস্থ্য কমপ্লেক্সে ২ ব্যাগ O+ রক্ত প্রয়োজন।', likes: 38, comments: 12, status: 'approved' },
  { id: 'p2', author: 'মেহেদী হাসান', tag: 'নোটিশ', title: 'আগামীকাল বিদ্যুৎ সরবরাহ বন্ধ থাকবে', body: 'রক্ষণাবেক্ষণ কাজের জন্য সকাল ৯টা থেকে দুপুর ২টা পর্যন্ত।', likes: 21, comments: 6, status: 'approved' },
];
const seedDonors = [
  { id: 'sd1', name: 'আবু সাঈদ', group: 'O+', area: 'পীরগঞ্জ সদর', phone: '', available: true },
  { id: 'sd2', name: 'নুসরাত জাহান', group: 'A+', area: 'ভোমরাদহ', phone: '', available: true },
];
const seedNotices = [
  { id: 'n1', title: 'উপজেলা পরিষদের মাসিক সভা', date: '২৮ সেপ্টেম্বর', label: 'সরকারি' },
  { id: 'n2', title: 'পীরগঞ্জ বাজারে পরিচ্ছন্নতা অভিযান', date: '৩০ সেপ্টেম্বর', label: 'কমিউনিটি' },
];
const fallbackOwned = new Map();
const fallbackComments = new Map();
const fallbackReactions = new Map();
const fallbackCommentReactions = new Map();
function client() { return getSupabase(); }
function hasDatabase() { return Boolean(client()); }
function mapService(row) { return { id: row.id, name: row.name, category: row.category, meta: row.meta || '', location: row.location || '', phone: row.phone || '', open: row.open_hours || '', icon: row.icon || '•', imageUrl: toPublicUrl(row.image_url || null), ownerId: row.owner_id || null }; }
function mapPost(row) { return { id: row.id, author: row.author_name || row.author || 'পীরগঞ্জবাসী', tag: row.tag, title: row.title, body: row.body, imageUrl: toPublicUrl(row.image_url || row.imageUrl || null), authorAvatarUrl: toPublicUrl(row.author_avatar_url || row.authorAvatarUrl || null), likes: row.likes_count || 0, comments: row.comments_count || 0, shares: row.shares_count || 0, status: row.status, ownerId: row.owner_id || row.author_id || null, createdAt: row.created_at || null }; }
function mapDonor(row) { return { id: row.id, name: row.name, group: row.blood_group || row.group, area: row.area || '', phone: row.phone || '', available: row.available, ownerId: row.owner_id || null }; }
function mapNotice(row) { return { id: row.id, title: row.title, body: row.body || '', date: row.notice_date || '', label: row.label, ownerId: row.owner_id || null }; }
function mapJob(row) { return { id: row.id, title: row.title, company: row.company || '', description: row.description || '', location: row.location || '', deadline: row.deadline || '', contactPhone: row.contact_phone || '', ownerId: row.owner_id || null }; }
function mapLostFound(row) { return { id: row.id, type: row.item_type, title: row.title, description: row.description || '', location: row.location || '', contactPhone: row.contact_phone || '', imageUrl: toPublicUrl(row.image_url || ''), ownerId: row.owner_id || null }; }
function remember(item, ownerId) { if (ownerId && item?.id) { const saved = { ...item, ownerId }; fallbackOwned.set(String(item.id), saved); rememberFallbackItem(saved); } return item; }

async function findServices({ category, search, limit = 20, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const term = String(search || '').trim().replace(/[,%]/g, ' ');
  if (!hasDatabase()) {
    const filtered = seedServices.filter((item) => (!category || category === 'সব' || item.category === category) && (!term || `${item.name} ${item.category} ${item.location}`.toLowerCase().includes(term.toLowerCase())));
    return filtered.slice(safeOffset, safeOffset + safeLimit);
  }
  let query = client().from('services').select('id,name,category,meta,location,phone,open_hours,icon,image_url,owner_id,created_at').eq('status', 'approved').order('created_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1);
  if (category && category !== 'সব') query = query.eq('category', category);
  if (term) query = query.or(`name.ilike.%${term}%,category.ilike.%${term}%,location.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapService);
}
async function findServiceById(id) { if (!hasDatabase()) return seedServices.find((item) => item.id === id) || null; const { data, error } = await client().from('services').select('*').eq('id', id).eq('status', 'approved').maybeSingle(); if (error) throw error; return data ? mapService(data) : null; }
async function findPosts(tag, viewerId = null, { limit = 20, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50); const safeOffset = Math.max(Number(offset) || 0, 0);
  if (!hasDatabase()) { const filtered = seedPosts.filter((item) => !tag || tag === 'সব' || item.tag === tag); return filtered.slice(safeOffset, safeOffset + safeLimit); }
  let query = client().from('posts').select('*').eq('status', 'approved').order('created_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1);
  if (tag && tag !== 'সব') query = query.eq('tag', tag);
  const { data, error } = await query; if (error) throw error;
  const rows = data || [];
  const postIds = rows.map((row) => row.id).filter(Boolean);
  const ownerIds = rows.map((row) => row.owner_id || row.author_id).filter(Boolean);
  const [authors, reactionRows, commentRows] = await Promise.all([
    getUsersByIds(ownerIds).catch(() => new Map()),
    postIds.length
      ? client().from('post_reactions').select('post_id,user_id,reaction').in('post_id', postIds)
          .then((result) => result.error ? [] : (result.data || [])).catch(() => [])
      : [],
    postIds.length
      ? client().from('comments').select('post_id').in('post_id', postIds)
          .then((result) => result.error ? [] : (result.data || [])).catch(() => [])
      : [],
  ]);
  const reactionsByPost = new Map();
  for (const reaction of reactionRows) {
    const list = reactionsByPost.get(String(reaction.post_id)) || [];
    list.push(reaction);
    reactionsByPost.set(String(reaction.post_id), list);
  }
  const commentsByPost = new Map();
  for (const comment of commentRows) {
    const key = String(comment.post_id);
    commentsByPost.set(key, (commentsByPost.get(key) || 0) + 1);
  }
  return rows.map((row) => {
    const post = mapPost(row);
    const authorId = row.owner_id || row.author_id;
    if (authorId) {
      const author = authors.get(String(authorId));
      post.authorAvatarUrl = toPublicUrl(author?.avatar_url || author?.avatarUrl || post.authorAvatarUrl || null);
    }
    const reactions = reactionsByPost.get(String(row.id)) || [];
    post.likes = reactions.length;
    if (viewerId) post.myReaction = reactions.find((item) => item.user_id === viewerId)?.reaction || null;
    post.comments = commentsByPost.get(String(row.id)) || 0;
    return post;
  });
}

async function addPost({ author, title, body, tag, imageUrl = null, authorId = null }) { const createdAt = new Date().toISOString(); const storedImageUrl = toDatabaseUrl(imageUrl); if (!hasDatabase()) return remember({ id: `p${Date.now()}`, author, tag, title, body, imageUrl: storedImageUrl, likes: 0, comments: 0, status: 'approved', createdAt }, authorId); const { data, error } = await client().from('posts').insert({ author_name: author, owner_id: authorId, title, body, tag, image_url: storedImageUrl || null, status: 'approved' }).select('*').single(); if (error) throw error; return mapPost(data); }
async function addService(input, ownerId = null) { const row = { name: input.name, category: input.category, meta: input.meta || '', location: input.location || '', phone: input.phone || '', open_hours: input.openHours || '', icon: input.icon || '•', status: 'approved', is_verified: false, owner_id: ownerId }; if (!hasDatabase()) return remember({ id: `d${Date.now()}`, ...mapService(row) }, ownerId); const { data, error } = await client().from('services').insert(row).select('*').single(); if (error) throw error; return mapService(data); }
async function addDonor(input, ownerId = null) { const row = { name: input.name, blood_group: input.bloodGroup, area: input.area || '', phone: input.phone, available: true, owner_id: ownerId }; if (!hasDatabase()) return remember({ id: `donor${Date.now()}`, name: input.name, group: input.bloodGroup, area: input.area || '', phone: input.phone, available: true }, ownerId); const { data, error } = await client().from('donors').insert(row).select('*').single(); if (error) throw error; return mapDonor(data); }
async function addBloodRequest(input, ownerId = null) { return insertMapped('blood_requests', { patient_name: input.patientName, blood_group: input.bloodGroup, units: Number(input.units || 1), hospital: input.hospital, area: input.area || '', contact_phone: input.phone, details: input.details || '', urgency: input.urgency || 'urgent', status: 'open', owner_id: ownerId }, undefined, ownerId); }
async function addNotice(input, ownerId = null) { return insertMapped('notices', { title: input.title, body: input.body || '', notice_date: input.date || null, label: input.label || 'কমিউনিটি', status: 'published', owner_id: ownerId }, mapNotice, ownerId); }
async function addJob(input, ownerId = null) { return insertMapped('jobs', { title: input.title, company: input.company || '', description: input.description || '', location: input.location || '', deadline: input.deadline || null, contact_phone: input.phone || '', status: 'published', owner_id: ownerId }, mapJob, ownerId); }
async function addLostFound(input, ownerId = null) { return insertMapped('lost_found', { item_type: input.type || 'lost', title: input.title, description: input.description || '', location: input.location || '', contact_phone: input.phone || '', image_url: input.imageUrl ? toDatabaseUrl(input.imageUrl) : null, status: 'published', owner_id: ownerId }, mapLostFound, ownerId); }
async function insertMapped(table, row, mapper = (value) => value, ownerId = null) { if (!hasDatabase()) { const id = `${table}-${Date.now()}`; const result = { id, ...row, ownerId }; return remember(mapper({ ...row, id }), ownerId) || result; } const { data, error } = await client().from(table).insert(row).select('*').single(); if (error) throw error; return mapper(data); }

async function toggleLike(id) { if (!hasDatabase()) { const post = seedPosts.find((item) => item.id === id); if (!post) return null; post.likes += 1; return post; } const db = client(); const current = await db.from('posts').select('likes_count').eq('id', id).maybeSingle(); if (current.error) throw current.error; if (!current.data) return null; const updated = await db.from('posts').update({ likes_count: (current.data.likes_count || 0) + 1 }).eq('id', id).select('*').single(); if (updated.error) throw updated.error; return mapPost(updated.data); }
 function mapComment(row) { return { id: row.id, author: row.author_name, body: row.body, createdAt: row.created_at || null, ownerId: row.owner_id || row.author_id || null, authorAvatarUrl: toPublicUrl(row.author_avatar_url || null), parentId: row.parent_id || null }; }
async function getComments(postId) {
  let rows;
  if (!hasDatabase()) {
    rows = [...fallbackComments.values()].filter((item) => item.postId === postId).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const authors = new Map(rows.map((item) => [String(item.id), item.author]));
    const users = await getUsersByIds(rows.map((item) => item.ownerId));
    return rows.map((item) => {
      const user = users.get(String(item.ownerId));
      const reactions = [...fallbackCommentReactions.values()].filter((reaction) => reaction.commentId === item.id).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      return { ...item, authorAvatarUrl: toPublicUrl(user?.avatar_url || null), replyToAuthor: item.parentId ? authors.get(String(item.parentId)) : null, reactions };
    });
  }
  const result = await client().from('comments').select('id,post_id,author_name,owner_id,body,parent_id,created_at').eq('post_id', postId).order('created_at', { ascending: false });
  if (result.error) throw result.error;
  rows = result.data || [];
  const ids = rows.map((row) => row.id).filter(Boolean);
  const authors = new Map(rows.map((row) => [String(row.id), row.author_name]));
  const reactionResult = ids.length ? await client().from('comment_reactions').select('comment_id,user_id,reaction,created_at').in('comment_id', ids).order('created_at', { ascending: false }) : { data: [], error: null };
  if (reactionResult.error) throw reactionResult.error;
  const reactionsByComment = new Map();
  for (const reaction of reactionResult.data || []) {
    const key = String(reaction.comment_id);
    reactionsByComment.set(key, [...(reactionsByComment.get(key) || []), mapReaction(reaction)]);
  }
  const users = await getUsersByIds([...rows.map((row) => row.owner_id), ...(reactionResult.data || []).map((row) => row.user_id)]);
  return rows.map((row) => {
    const user = users.get(String(row.owner_id));
    const reactions = reactionsByComment.get(String(row.id)) || [];
    return { ...mapComment(row), authorAvatarUrl: toPublicUrl(user?.avatar_url || row.author_avatar_url || null), replyToAuthor: row.parent_id ? authors.get(String(row.parent_id)) : null, reactions: reactions.map((item) => { const reactionUser = users.get(String(item.userId)); return { ...item, userName: reactionUser?.name || item.userId, userAvatarUrl: toPublicUrl(reactionUser?.avatar_url || null) }; }) };
  });
}
async function addComment(postId, { author, body, authorId = null, parentId = null }) { const createdAt = new Date().toISOString(); if (!hasDatabase()) { const comment = { id: `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`, postId, author: author || 'পীরগঞ্জবাসী', body, createdAt, ownerId: authorId, parentId }; fallbackComments.set(comment.id, comment); const enriched = await getComments(postId); return enriched.find((item) => String(item.id) === String(comment.id)) || comment; } const row = { post_id: postId, author_name: author || 'পীরগঞ্জবাসী', owner_id: authorId, body }; if (parentId) row.parent_id = parentId; const { data, error } = await client().from('comments').insert(row).select('*').single(); if (error) throw error; const enriched = await getComments(postId); return enriched.find((item) => String(item.id) === String(data.id)) || mapComment(data); }
async function updateComment(id, ownerId, body) { if (!hasDatabase()) { const item = fallbackComments.get(String(id)); if (!item || item.ownerId !== ownerId) return null; item.body = body; return item; } const { data, error } = await client().from('comments').update({ body }).eq('id', id).eq('owner_id', ownerId).select('*').maybeSingle(); if (error) throw error; return data ? mapComment(data) : null; }
async function deleteComment(id, ownerId) { if (!hasDatabase()) { const item = fallbackComments.get(String(id)); if (!item || item.ownerId !== ownerId) return false; fallbackComments.delete(String(id)); return true; } const { data, error } = await client().from('comments').delete().eq('id', id).eq('owner_id', ownerId).select('id'); if (error) throw error; return Boolean(data?.length); }
function mapReaction(row) { return { userId: row.user_id || row.userId, reaction: row.reaction || 'like', createdAt: row.created_at || null }; }
async function toggleReaction(postId, userId, reaction = 'like') {
  let change;
  if (!hasDatabase()) {
    const key = `${postId}:${userId}`;
    const current = fallbackReactions.get(key);
    if (current && current.reaction === reaction) {
      fallbackReactions.delete(key);
      change = 'removed';
    } else if (current) {
      fallbackReactions.set(key, { ...current, reaction, createdAt: new Date().toISOString() });
      change = 'changed';
    } else {
      fallbackReactions.set(key, { postId, userId, reaction, createdAt: new Date().toISOString() });
      change = 'added';
    }
    return { reactions: await getReactions(postId), change };
  }
  const db = client();
  const existing = await db.from('post_reactions').select('id,reaction').eq('post_id', postId).eq('user_id', userId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data && existing.data.reaction === reaction) {
    const removed = await db.from('post_reactions').delete().eq('id', existing.data.id);
    if (removed.error) throw removed.error;
    change = 'removed';
  } else if (existing.data) {
    const updated = await db.from('post_reactions').update({ reaction }).eq('id', existing.data.id);
    if (updated.error) throw updated.error;
    change = 'changed';
  } else {
    const added = await db.from('post_reactions').insert({ post_id: postId, user_id: userId, reaction });
    if (added.error) throw added.error;
    change = 'added';
  }
  return { reactions: await getReactions(postId), change };
}

async function getReactions(postId) { if (!hasDatabase()) return [...fallbackReactions.values()].filter((item) => item.postId === postId).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).map((item) => ({ userId: item.userId, reaction: item.reaction, createdAt: item.createdAt || null })); const { data, error } = await client().from('post_reactions').select('user_id,reaction,created_at').eq('post_id', postId).order('created_at', { ascending: false }); if (error) throw error; return (data || []).map(mapReaction); }
async function enrichReactionUsers(list) {
  const users = await getUsersByIds((list || []).map((item) => item.userId || item.user_id));
  return (list || []).map((item) => {
    const id = item.userId || item.user_id;
    const user = users.get(String(id));
    return { ...item, userName: user?.name || id, userAvatarUrl: toPublicUrl(user?.avatar_url || null) };
  });
}

async function getCommentReactions(commentId) { if (!hasDatabase()) return [...fallbackCommentReactions.values()].filter((item) => item.commentId === commentId).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).map((item) => ({ userId: item.userId, reaction: item.reaction, createdAt: item.createdAt || null })); const { data, error } = await client().from('comment_reactions').select('user_id,reaction,created_at').eq('comment_id', commentId).order('created_at', { ascending: false }); if (error) throw error; return (data || []).map(mapReaction); }
async function toggleCommentReaction(commentId, userId, reaction = 'like') {
  let change;
  if (!hasDatabase()) {
    const key = `${commentId}:${userId}`;
    const current = fallbackCommentReactions.get(key);
    if (current && current.reaction === reaction) {
      fallbackCommentReactions.delete(key);
      change = 'removed';
    } else if (current) {
      fallbackCommentReactions.set(key, { ...current, reaction, createdAt: new Date().toISOString() });
      change = 'changed';
    } else {
      fallbackCommentReactions.set(key, { commentId, userId, reaction, createdAt: new Date().toISOString() });
      change = 'added';
    }
    return { reactions: await getCommentReactions(commentId), change };
  }
  const db = client();
  const existing = await db.from('comment_reactions').select('id,reaction').eq('comment_id', commentId).eq('user_id', userId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data && existing.data.reaction === reaction) {
    const removed = await db.from('comment_reactions').delete().eq('id', existing.data.id);
    if (removed.error) throw removed.error;
    change = 'removed';
  } else if (existing.data) {
    const updated = await db.from('comment_reactions').update({ reaction }).eq('id', existing.data.id);
    if (updated.error) throw updated.error;
    change = 'changed';
  } else {
    const added = await db.from('comment_reactions').insert({ comment_id: commentId, user_id: userId, reaction });
    if (added.error) throw added.error;
    change = 'added';
  }
  return { reactions: await getCommentReactions(commentId), change };
}

async function getDonors(group, { limit = 20, offset = 0 } = {}) { const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50); const safeOffset = Math.max(Number(offset) || 0, 0); if (!hasDatabase()) return seedDonors.filter((item) => !group || group === 'সব' || item.group === group).slice(safeOffset, safeOffset + safeLimit); let query = client().from('donors').select('*').eq('available', true).order('created_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1); if (group && group !== 'সব') query = query.eq('blood_group', group); const { data, error } = await query; if (error) throw error; return (data || []).map(mapDonor); }
async function getBloodRequests(group, { limit = 20, offset = 0 } = {}) { const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50); const safeOffset = Math.max(Number(offset) || 0, 0); if (!hasDatabase()) return seedPosts.filter((post) => post.tag === 'জরুরি' && (!group || group === 'সব' || post.title.includes(group))).slice(safeOffset, safeOffset + safeLimit); let query = client().from('blood_requests').select('*').eq('status', 'open').order('created_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1); if (group && group !== 'সব') query = query.eq('blood_group', group); const { data, error } = await query; if (error) throw error; return (data || []).map((row) => ({ id: row.id, patientName: row.patient_name, group: row.blood_group, hospital: row.hospital, area: row.area || '', phone: row.contact_phone || '', details: row.details || '', units: row.units || 1, ownerId: row.owner_id || null })); }
async function getNotices({ limit = 20, offset = 0 } = {}) { const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50); const safeOffset = Math.max(Number(offset) || 0, 0); return hasDatabase() ? queryRows('notices', 'status', 'published', mapNotice, { limit: safeLimit, offset: safeOffset }) : seedNotices.slice(safeOffset, safeOffset + safeLimit); }
async function getJobs({ limit = 20, offset = 0 } = {}) { return hasDatabase() ? queryRows('jobs', 'status', 'published', mapJob, { limit, offset }) : []; }
async function getLostFound({ limit = 20, offset = 0 } = {}) {
  if (!hasDatabase()) return [];
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  const { data, error } = await client().from('lost_found').select('*').in('status', ['published', 'approved']).order('created_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1);
  if (error) throw error;
  return (data || []).map(mapLostFound);
}
async function queryRows(table, field, value, mapper = (row) => row, { limit = 20, offset = 0 } = {}) { const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50); const safeOffset = Math.max(Number(offset) || 0, 0); const { data, error } = await client().from(table).select('*').eq(field, value).order('created_at', { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1); if (error) throw error; return (data || []).map(mapper); }
async function searchAll(q) { const [serviceRows, postRows] = await Promise.all([findServices({ search: q }), findPosts()]); const normalized = String(q || '').toLowerCase(); return { services: serviceRows, posts: postRows.filter((post) => `${post.title} ${post.body}`.toLowerCase().includes(normalized)) }; }
async function getOverview() { const [services, posts, donors, notices] = await Promise.all([findServices(), findPosts(), getDonors(), getNotices()]); return { services, posts, donors, notices }; }
async function getAdminSummary() { if (!hasDatabase()) return { pending: 0, members: 0, reports: 0, services: seedServices.length }; const db = client(); const [pending, serviceRows, profiles] = await Promise.all([db.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'pending'), db.from('services').select('id', { count: 'exact', head: true }), db.from('users').select('id', { count: 'exact', head: true })]); if (pending.error || serviceRows.error || profiles.error) throw pending.error || serviceRows.error || profiles.error; return { pending: pending.count || 0, members: profiles.count || 0, reports: 0, services: serviceRows.count || 0 }; }

const tableMap = { services: mapService, posts: mapPost, donors: mapDonor, blood_requests: (row) => ({ id: row.id, patientName: row.patient_name, group: row.blood_group, hospital: row.hospital, area: row.area || '', phone: row.contact_phone || '', details: row.details || '', units: row.units || 1, ownerId: row.owner_id || null }), notices: mapNotice, jobs: mapJob, lost_found: mapLostFound };
async function getMyItems(ownerId) {
  if (!hasDatabase()) return (await getUserById(ownerId)) ? [...fallbackOwned.values()].filter((item) => item.ownerId === ownerId) : [];
  const db = client();
  const entries = Object.entries(tableMap);
  const rows = await Promise.all(entries.map(async ([table, mapper]) => {
    const result = await db.from(table).select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(100);
    if (result.error) throw result.error;
    return (result.data || []).map((row) => ({ ...mapper(row), resource: table }));
  }));
  return rows.flat();
}
async function getPublicProfile(ownerId) {
  const user = await getUserById(ownerId);
  if (!user) return null;
  const locked = user.profile_locked === true || user.profileLocked === true;
  if (locked) return { user: { id: user.id, name: user.name, sex: user.sex || '', address: user.address || '', avatarUrl: toPublicUrl(user.avatar_url || user.avatarUrl || null), profileLocked: true }, items: [] };
  const items = await getMyItems(ownerId);
  const safeItems = items.map((item) => {
    const { phone, contactPhone, ...safe } = item;
    return { ...safe, ownerId };
  });
  return { user: { id: user.id, name: user.name, sex: user.sex, address: user.address || '', avatarUrl: toPublicUrl(user.avatar_url || user.avatarUrl || null), profileLocked: false }, items: safeItems };
}
async function updateOwned(resource, id, ownerId, input) { const allowed = { services: { name: input.name, category: input.category, meta: input.meta, location: input.location, phone: input.phone, open_hours: input.openHours }, posts: { title: input.title, body: input.body, tag: input.tag, image_url: input.imageUrl === undefined ? undefined : toDatabaseUrl(input.imageUrl) }, donors: { name: input.name, blood_group: input.bloodGroup, area: input.area, phone: input.phone }, blood_requests: { patient_name: input.patientName, blood_group: input.bloodGroup, hospital: input.hospital, area: input.area, contact_phone: input.phone, details: input.details, units: input.units }, notices: { title: input.title, body: input.body, label: input.label }, jobs: { title: input.title, company: input.company, description: input.description, location: input.location, contact_phone: input.phone }, lost_found: { title: input.title, description: input.description, location: input.location, contact_phone: input.phone, image_url: input.imageUrl === undefined ? undefined : toDatabaseUrl(input.imageUrl) } }[resource]; if (!allowed) throw new Error('Unsupported resource'); const clean = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined)); if (!hasDatabase()) { const item = getFallbackItem(id); if (!item || item.ownerId !== ownerId) return null; Object.assign(item, input); if (resource === 'donors' && input.bloodGroup !== undefined) item.group = input.bloodGroup; if (resource === 'blood_requests') { if (input.bloodGroup !== undefined) item.group = input.bloodGroup; if (input.patientName !== undefined) item.patientName = input.patientName; if (input.phone !== undefined) item.phone = input.phone; } return item; } let oldImage = null; if ((resource === 'posts' || resource === 'lost_found') && input.imageUrl !== undefined) { const current = await client().from(resource).select('image_url').eq('id', id).eq('owner_id', ownerId).maybeSingle(); if (current.error) throw current.error; oldImage = current.data?.image_url || null; } const { data, error } = await client().from(resource).update(clean).eq('id', id).eq('owner_id', ownerId).select('*').maybeSingle(); if (error) throw error; if (oldImage && oldImage !== data?.image_url) await removeImageByUrl(oldImage); return data ? tableMap[resource](data) : null; }
async function deleteOwned(resource, id, ownerId) { if (!tableMap[resource]) throw new Error('Unsupported resource'); if (!hasDatabase()) { const item = getFallbackItem(id); if (!item || item.ownerId !== ownerId) return false; deleteFallbackItem(id); fallbackOwned.delete(String(id)); return true; } let oldImage = null; if (['services', 'posts', 'notices', 'lost_found'].includes(resource)) { const current = await client().from(resource).select('image_url').eq('id', id).eq('owner_id', ownerId).maybeSingle(); if (current.error) throw current.error; oldImage = current.data?.image_url || null; } const { data, error } = await client().from(resource).delete().eq('id', id).eq('owner_id', ownerId).select('id'); if (error) throw error; if (data?.length && oldImage) await removeImageByUrl(oldImage); return Boolean(data?.length); }

module.exports = { findServices, findServiceById, findPosts, addPost, addService, addDonor, addBloodRequest, addNotice, addJob, addLostFound, toggleLike, getComments, addComment, updateComment, deleteComment, toggleReaction, getReactions, getCommentReactions, toggleCommentReaction, getDonors, getBloodRequests, getNotices, getJobs, getLostFound, searchAll, getOverview, getAdminSummary, getMyItems, getPublicProfile, updateOwned, deleteOwned };
