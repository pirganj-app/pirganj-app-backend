const $ = (selector) => document.querySelector(selector);
let token = localStorage.getItem('pirganj_admin_token');
let selectedUser = null;
let users = [];
let activity = [];
const tabTitles = { dashboard: 'Dashboard', users: 'Users', views: 'View Analytics', activity: 'Activity Logs', failed: 'Failed Logins' };
const actionLabel = (action) => ({ page_visit: 'PAGE_VIEW', login: 'LOGIN', logout: 'LOGOUT', login_failed: 'LOGIN_FAILED', google_login: 'GOOGLE_LOGIN' }[action] || String(action || 'ACTIVITY').toUpperCase());
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const dateText = (value) => value ? new Date(value).toLocaleString() : '—';
const api = (path, options = {}) => fetch('/api/admin' + path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } }).then(async (response) => { const json = await response.json(); if (!response.ok || !json.success) throw Error(json.data?.message || 'অনুরোধ সম্পন্ন হয়নি'); return json.data; });
function show(text) { const toast = $('#toast'); toast.textContent = text; toast.classList.remove('hidden'); setTimeout(() => toast.classList.add('hidden'), 2800); }
function badge(action) { const kind = action === 'login' || action === 'google_login' ? 'bg-ok' : action === 'login_failed' ? 'bg-bl' : 'bg-ac'; return `<span class="bg ${kind}">${escapeHtml(actionLabel(action))}</span>`; }
function userName(id) { if (!id) return 'Guest'; const user = users.find((item) => String(item.id) === String(id)); return user?.name || user?.email || id; }
function userQuery() { const p = new URLSearchParams(); [['name', '#nameFilter'], ['email', '#emailFilter'], ['phone', '#phoneFilter']].forEach(([key, selector]) => { const value = $(selector).value.trim(); if (value) p.set(key, value); }); return p.toString(); }
function renderUsers() {
  $('#usersBody').innerHTML = users.map((user) => `<tr class="clickable"><td class="cu">${escapeHtml(user.name || 'নাম নেই')}</td><td class="cm">${escapeHtml(user.phone || '—')}</td><td class="cm">${escapeHtml(user.email || '—')}</td><td><span class="bg ${user.is_blocked ? 'bg-bl' : 'bg-ok'}">${user.is_blocked ? 'Blocked' : 'Active'}</span></td><td class="cm">${Number(user.failed_login_attempts || 0)}</td><td><div class="act-btns"><button class="table-btn" data-view="${escapeHtml(user.id)}">Activity</button><button class="table-btn ${user.is_blocked ? '' : 'danger'}" data-block="${escapeHtml(user.id)}" data-next="${!user.is_blocked}">${user.is_blocked ? 'Unblock' : 'Block'}</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="empty">কোনো user পাওয়া যায়নি</td></tr>';
  document.querySelectorAll('[data-view]').forEach((button) => button.onclick = () => { selectedUser = button.dataset.view; switchTab('activity'); loadActivity(); });
  document.querySelectorAll('[data-block]').forEach((button) => button.onclick = async () => { try { await api(`/users/${encodeURIComponent(button.dataset.block)}/block`, { method: 'PUT', body: JSON.stringify({ blocked: button.dataset.next === 'true' }) }); show('User status আপডেট হয়েছে'); await loadUsers(); } catch (error) { show(error.message); } });
}
function renderActivity(target, rows, mode = 'activity') {
  const body = $(target);
  if (!rows.length) { body.innerHTML = `<tr><td colspan="${mode === 'views' || mode === 'failed' ? 4 : 5}" class="empty">কোনো activity নেই</td></tr>`; return; }
  body.innerHTML = rows.map((item) => { const name = escapeHtml(userName(item.user_id)); const ip = escapeHtml(item.ip_address || 'অজানা'); const time = escapeHtml(dateText(item.created_at)); const attempts = item.metadata?.attempts ? ` · চেষ্টা: ${escapeHtml(item.metadata.attempts)}` : ''; if (mode === 'views') return `<tr><td>${badge('page_visit')}<br><span class="subtle">${escapeHtml(item.path || '—')}</span></td><td class="cu">${name}</td><td class="cm">${ip}</td><td class="cm">${time}</td></tr>`; if (mode === 'failed') return `<tr><td class="cu">${name}</td><td class="cm">${escapeHtml(item.metadata?.attempts || '1')}</td><td class="cm">${ip}</td><td class="cm">${time}</td></tr>`; return `<tr><td class="cu">${name}</td><td>${badge(item.action)}</td><td class="cm">${escapeHtml(item.path || '—')}${attempts}</td><td class="cm">${ip}</td><td class="cm">${time}</td></tr>`; }).join('');
}
function updateStats() { $('#statUsers').textContent = users.length; $('#statViews').textContent = activity.filter((item) => item.action === 'page_visit').length; $('#statLogins').textContent = activity.filter((item) => item.action === 'login' || item.action === 'google_login').length; $('#statBlocked').textContent = users.filter((item) => item.is_blocked).length; renderActivity('#recentBody', activity.slice(0, 8)); }
async function loadUsers() { try { users = await api(`/users?${userQuery()}`); renderUsers(); updateStats(); } catch (error) { show(error.message); } }
async function loadActivity() { try { activity = await api(`/activity?limit=500${selectedUser ? `&userId=${encodeURIComponent(selectedUser)}` : ''}`); renderActivity('#activityBody', activity); renderActivity('#viewsBody', activity.filter((item) => item.action === 'page_visit'), 'views'); renderActivity('#failedBody', activity.filter((item) => item.action === 'login_failed'), 'failed'); updateStats(); } catch (error) { show(error.message); } }
function switchTab(tab) { document.querySelectorAll('.adm-nav button[data-tab]').forEach((button) => button.classList.toggle('on', button.dataset.tab === tab)); document.querySelectorAll('.tp').forEach((panel) => panel.classList.toggle('on', panel.id === `t-${tab}`)); $('#adm-title').textContent = tabTitles[tab]; $('#adm-side').classList.remove('open'); $('#adm-ov').classList.remove('on'); }
async function enter() { if (!token) return; try { await api('/session'); $('#loginScreen').classList.add('hidden'); $('#app').classList.remove('hidden'); await Promise.all([loadUsers(), loadActivity()]); } catch (_) { token = null; localStorage.removeItem('pirganj_admin_token'); $('#loginScreen').classList.remove('hidden'); } }
$('#loginForm').onsubmit = async (event) => { event.preventDefault(); try { const result = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: $('#username').value, password: $('#password').value }) }).then((response) => response.json()); if (!result.success) throw Error(result.data?.message || 'Login হয়নি'); token = result.data.token; localStorage.setItem('pirganj_admin_token', token); await enter(); } catch (error) { $('#loginError').textContent = error.message; } };
$('#logout').onclick = () => { token = null; localStorage.removeItem('pirganj_admin_token'); location.reload(); };
$('#menu').onclick = () => { $('#adm-side').classList.toggle('open'); $('#adm-ov').classList.toggle('on'); };
$('#adm-ov').onclick = () => { $('#adm-side').classList.remove('open'); $('#adm-ov').classList.remove('on'); };
document.querySelectorAll('.adm-nav button[data-tab]').forEach((button) => button.onclick = () => switchTab(button.dataset.tab));
['#nameFilter', '#emailFilter', '#phoneFilter'].forEach((selector) => $(selector).oninput = () => loadUsers());
$('#clearFilters').onclick = () => { ['#nameFilter', '#emailFilter', '#phoneFilter'].forEach((selector) => { $(selector).value = ''; }); selectedUser = null; loadUsers(); loadActivity(); };
$('#globalSearch').oninput = () => { $('#nameFilter').value = $('#globalSearch').value; switchTab('users'); loadUsers(); };
['#dashboardRefresh', '#viewsRefresh', '#activityRefresh', '#failedRefresh'].forEach((selector) => $(selector).onclick = loadActivity);
$('#clearSelection').onclick = () => { selectedUser = null; loadActivity(); };
enter();
