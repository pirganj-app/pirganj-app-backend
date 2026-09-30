const $ = (selector) => document.querySelector(selector);
let token = localStorage.getItem('pirganj_admin_token');
let selectedUser = null;

const api = (path, opts = {}) => fetch('/api/admin' + path, {
  ...opts,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
}).then(async (response) => {
  const json = await response.json();
  if (!response.ok || !json.success) throw Error(json.data?.message || 'অনুরোধ সম্পন্ন হয়নি');
  return json.data;
});

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const actionLabel = (action) => ({ page_visit: 'Page visit', login: 'Login', logout: 'Logout', login_failed: 'ভুল password attempt', google_login: 'Google login' }[action] || action || 'Activity');

function show(text) {
  const element = $('#message');
  element.textContent = text;
  element.hidden = false;
  setTimeout(() => { element.hidden = true; }, 3000);
}

function userQuery() {
  const params = new URLSearchParams();
  [['name', '#nameFilter'], ['email', '#emailFilter'], ['phone', '#phoneFilter']].forEach(([key, selector]) => {
    const value = $(selector).value.trim();
    if (value) params.set(key, value);
  });
  return params.toString();
}

function renderUsers(rows) {
  $('#users').innerHTML = rows.map((user) => `<div class="user">
    <strong>${escapeHtml(user.name || 'নাম নেই')} ${user.is_blocked ? '🔒' : ''}</strong>
    <small>${escapeHtml(user.email || '')} · ${escapeHtml(user.phone || '')}<br>ভুল password: ${Number(user.failed_login_attempts || 0)}${user.locked_until ? ` · Lock: ${escapeHtml(new Date(user.locked_until).toLocaleString())}` : ''}</small>
    <div class="userActions"><button class="viewActivity" data-id="${escapeHtml(user.id)}" data-name="${escapeHtml(user.name || user.email || user.phone || 'User')}">Activity দেখুন</button><button class="block" data-id="${escapeHtml(user.id)}" data-block="${!user.is_blocked}">${user.is_blocked ? 'Unblock' : 'Block'}</button></div>
  </div>`).join('') || '<p class="muted">কোনো user পাওয়া যায়নি</p>';
  document.querySelectorAll('.viewActivity').forEach((button) => button.onclick = () => {
    selectedUser = { id: button.dataset.id, name: button.dataset.name };
    $('#activityTitle').textContent = `${selectedUser.name}-এর activity`;
    loadActivity();
  });
  document.querySelectorAll('.block').forEach((button) => button.onclick = async () => {
    try {
      await api(`/users/${encodeURIComponent(button.dataset.id)}/block`, { method: 'PUT', body: JSON.stringify({ blocked: button.dataset.block === 'true' }) });
      show('User security status আপডেট হয়েছে');
      loadUsers();
    } catch (error) { show(error.message); }
  });
}

async function loadUsers() {
  try { renderUsers(await api(`/users?${userQuery()}`)); } catch (error) { show(error.message); }
}

async function loadActivity() {
  try {
    const query = selectedUser ? `?userId=${encodeURIComponent(selectedUser.id)}` : '';
    const rows = await api(`/activity${query}`);
    $('#activity').innerHTML = rows.map((item) => {
      const metadata = item.metadata || {};
      const attempts = metadata.attempts ? ` · চেষ্টা: ${escapeHtml(metadata.attempts)}` : '';
      const path = item.path ? escapeHtml(item.path) : '—';
      return `<div class="activityRow"><span>${escapeHtml(new Date(item.created_at).toLocaleString())}</span><span><b>${escapeHtml(actionLabel(item.action))}</b><br><span class="muted">${path}${attempts}</span></span><span>IP: ${escapeHtml(item.ip_address || 'অজানা')}</span></div>`;
    }).join('') || '<p class="muted">কোনো activity নেই</p>';
  } catch (error) { show(error.message); }
}

async function enter() {
  if (!token) { $('#loginCard').hidden = false; return; }
  try {
    await api('/session');
    $('#loginCard').hidden = true;
    $('#panel').hidden = false;
    await loadUsers();
    await loadActivity();
  } catch (_) {
    token = null;
    localStorage.removeItem('pirganj_admin_token');
    $('#loginCard').hidden = false;
  }
}

$('#loginForm').onsubmit = async (event) => {
  event.preventDefault();
  try {
    const result = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: $('#username').value, password: $('#password').value }) }).then((response) => response.json());
    if (!result.success) throw Error(result.data?.message || 'Login হয়নি');
    token = result.data.token;
    localStorage.setItem('pirganj_admin_token', token);
    enter();
  } catch (error) { $('#loginError').textContent = error.message; }
};
$('#logout').onclick = () => { token = null; localStorage.removeItem('pirganj_admin_token'); location.reload(); };
$('#refresh').onclick = loadActivity;
['#nameFilter', '#emailFilter', '#phoneFilter'].forEach((selector) => $(selector).oninput = loadUsers);
$('#clearFilters').onclick = () => { ['#nameFilter', '#emailFilter', '#phoneFilter'].forEach((selector) => { $(selector).value = ''; }); selectedUser = null; $('#activityTitle').textContent = 'Activity log'; loadUsers(); loadActivity(); };
enter();
