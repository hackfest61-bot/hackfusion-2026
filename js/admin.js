/* ==================== ADMIN.JS ==================== */

const ADMIN_CREDS = { email: 'admin@hackfusion.dev', password: 'admin123' };

// ── Admin Gate Login ──
document.getElementById('adminLoginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('gate-email').value.trim();
  const pw    = document.getElementById('gate-password').value;
  const err   = document.getElementById('gateError');

  if (email === ADMIN_CREDS.email && pw === ADMIN_CREDS.password) {
    err.classList.add('hidden');
    DB.set('adminAuth', true);
    openDashboard();
  } else {
    err.classList.remove('hidden');
    const card = document.querySelector('.admin-gate .auth-card');
    card.style.animation = 'shake 0.4s ease';
    setTimeout(() => card.style.animation = '', 400);
  }
});

// ── Check existing session ──
window.addEventListener('DOMContentLoaded', () => {
  if (DB.get('adminAuth')) openDashboard();
  // Shake anim
  const s = document.createElement('style');
  s.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`;
  document.head.appendChild(s);
});

function openDashboard() {
  hide('adminGate');
  document.getElementById('adminDashboard').classList.remove('hidden');
  initDashboard();
}

function adminLogout() {
  DB.set('adminAuth', false);
  showToast('Logged out.', 'info');
  setTimeout(() => window.location.href = 'index.html', 800);
}

// ── Init Dashboard ──
function initDashboard() {
  loadOverview();
  loadParticipants();
  loadTeams();
  loadAnnouncements();
  loadProblemStatements();
  loadPrizes();
  loadSponsors();
  animateStatCounters();
}

// ── Panel switching ──
function showPanel(name, linkEl) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const panel = document.getElementById('panel-' + name);
  if (panel) panel.classList.add('active');
  if (linkEl) linkEl.classList.add('active');
  document.getElementById('topbarTitle').textContent =
    linkEl ? linkEl.textContent.trim().replace(/^[^ ]+ /,'') : name;
  // close sidebar on mobile
  document.getElementById('adminSidebar').classList.remove('open');
  return false;
}

function toggleSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

// ── Overview ──
function loadOverview() {
  const participants = getAllParticipants();
  const teams        = getTeams();

  animateNum('stat-participants', participants.length);
  animateNum('stat-teams',        teams.length);
  animateNum('stat-submissions',  0);
  animateNum('stat-countries',    28);

  document.getElementById('r1-teams').textContent = teams.length;
  document.getElementById('r1-subs').textContent  = 0;

  renderBarChart();
  renderTrackDist(participants);
  renderActivityFeed(participants, teams);
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step = Math.max(1, Math.floor(target / 40));
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = cur.toLocaleString();
    if (cur >= target) clearInterval(t);
  }, 30);
}

function animateStatCounters() {
  // triggered by initDashboard
}

function renderBarChart() {
  const days   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const values = [4, 7, 5, 12, 9, 15, 8];
  const max    = Math.max(...values);
  const chart  = document.getElementById('regChart');
  if (!chart) return;
  chart.innerHTML = values.map((v, i) => `
    <div class="bar-col">
      <div class="bar-fill" data-val="${v}" style="height:${(v/max)*100}%"></div>
      <span class="bar-label">${days[i]}</span>
    </div>`).join('');
}

function renderTrackDist(participants) {
  const tracks = { ai:'🤖 AI/ML', web3:'⛓️ Web3', health:'🏥 HealthTech', climate:'🌱 Climate', gamefi:'🎮 GameFi', open:'🔓 Open' };
  const counts = {};
  Object.keys(tracks).forEach(k => counts[k] = 0);
  participants.forEach(p => { if (counts[p.track] !== undefined) counts[p.track]++; });
  const max = Math.max(...Object.values(counts), 1);
  const dist = document.getElementById('trackDist');
  if (!dist) return;
  dist.innerHTML = Object.entries(tracks).map(([k, label]) => `
    <div class="track-dist-row">
      <span class="td-label">${label}</span>
      <div class="td-bar-wrap"><div class="td-bar" style="width:${(counts[k]/max)*100}%"></div></div>
      <span class="td-count">${counts[k]}</span>
    </div>`).join('');
}

function renderActivityFeed(participants, teams) {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;
  const recent = [...participants].reverse().slice(0, 8);
  const items  = [
    ...recent.map(p => ({ type:'reg',  text:`<strong>${p.name}</strong> registered`, time: relTime(p.registeredAt) })),
    ...teams.slice(-4).map(t => ({ type:'team', text:`Team <strong>${t.name}</strong> created`, time: relTime(t.createdAt) }))
  ].sort((a,b) => 0).slice(0, 12);
  feed.innerHTML = items.map(i => `
    <div class="activity-item">
      <div class="activity-dot ${i.type}"></div>
      <span class="activity-text">${i.text}</span>
      <span class="activity-time">${i.time}</span>
    </div>`).join('');
}

function refreshActivity() {
  renderActivityFeed(getAllParticipants(), getTeams());
  showToast('Activity refreshed', 'info');
}

function relTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

// ── Participants ──
let allParticipants = [];
let filteredParticipants = [];
let currentPage = 1;
const PAGE_SIZE = 10;

function getAllParticipants() {
  return DB.get('participants') || [];
}

function loadParticipants() {
  allParticipants = getAllParticipants();
  filterParticipants();
}

function filterParticipants() {
  const search  = (document.getElementById('participantSearch')?.value || '').toLowerCase();
  const track   = document.getElementById('filterTrack')?.value || '';
  const level   = document.getElementById('filterLevel')?.value || '';

  filteredParticipants = allParticipants.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search) ||
      p.email.toLowerCase().includes(search) ||
      (p.college||'').toLowerCase().includes(search);
    const matchTrack  = !track  || p.track === track;
    const matchLevel  = !level  || p.level === level;
    return matchSearch && matchTrack && matchLevel;
  });

  currentPage = 1;
  renderParticipantTable();
}

function renderParticipantTable() {
  const teams = getTeams();
  const tbody = document.getElementById('participantBody');
  const count = document.getElementById('participantCount');
  if (!tbody) return;

  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filteredParticipants.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = page.map((p, i) => {
    const team = teams.find(t => t.id === p.teamId);
    return `<tr>
      <td>${start + i + 1}</td>
      <td><strong>${esc(p.name)}</strong></td>
      <td><a href="mailto:${esc(p.email)}" style="color:var(--accent);text-decoration:none;">${esc(p.email)}</a></td>
      <td>${esc(p.college||'—')}</td>
      <td><span class="track-pill">${formatTrackShort(p.track)}</span></td>
      <td><span class="level-pill ${p.level}">${cap(p.level)}</span></td>
      <td>${team ? `<span style="color:var(--accent);">${esc(team.name)}</span>` : '<span style="color:var(--text-dim);">Solo</span>'}</td>
      <td>${formatDate(p.registeredAt)}</td>
      <td style="display:flex;gap:0.4rem;flex-wrap:wrap;">
        <button class="table-action-btn" onclick="viewParticipant('${p.id}')">View</button>
        <button class="table-action-btn danger" onclick="removeParticipant('${p.id}')">Remove</button>
      </td>
    </tr>`;
  }).join('');

  if (!page.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-dim);padding:2rem;">No participants found.</td></tr>';
  }

  if (count) count.textContent = `Showing ${filteredParticipants.length} participant${filteredParticipants.length !== 1 ? 's' : ''}`;
  renderPagination();
}

function renderPagination() {
  const pag = document.getElementById('participantPagination');
  if (!pag) return;
  const totalPages = Math.ceil(filteredParticipants.length / PAGE_SIZE);
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn${i === currentPage ? ' active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  pag.innerHTML = html;
}

function goPage(p) {
  currentPage = p;
  renderParticipantTable();
}

function viewParticipant(id) {
  const p = getAllParticipants().find(x => x.id === id);
  if (!p) return;
  const team = getTeams().find(t => t.id === p.teamId);
  const rows = [
    ['Name', p.name], ['Email', p.email], ['College', p.college||'—'],
    ['Track', formatTrack(p.track)], ['Level', formatLevel(p.level)],
    ['GitHub', p.github ? `<a href="${esc(p.github)}" target="_blank" style="color:var(--accent);">View</a>` : '—'],
    ['Team', team ? team.name : 'No team yet'],
    ['Team Role', team && team.leaderId === p.id ? '👑 Leader' : '👥 Member'],
    ['Registered', new Date(p.registeredAt).toLocaleString()],
  ];
  document.getElementById('modalContent').innerHTML = `
    <h2 style="font-family:var(--font-display);font-size:1.1rem;color:white;margin-bottom:1.2rem;">${esc(p.name)}</h2>
    ${rows.map(([l,v]) => `<div class="modal-detail-row"><span class="md-label">${l}</span><span class="md-val">${v}</span></div>`).join('')}
  `;
  show('participantModal');
}

function removeParticipant(id) {
  openConfirm('Remove Participant', 'Are you sure you want to remove this participant?', () => {
    let ps = DB.get('participants') || [];
    ps = ps.filter(p => p.id !== id);
    DB.set('participants', ps);
    allParticipants = ps;
    filterParticipants();
    showToast('Participant removed.', 'success');
  });
}

function exportCSV() {
  const cols = ['Name','Email','College','Track','Level','Team','Registered'];
  const teams = getTeams();
  const rows  = filteredParticipants.map(p => {
    const team = teams.find(t => t.id === p.teamId);
    return [p.name, p.email, p.college||'', formatTrackShort(p.track), p.level, team?team.name:'Solo', formatDate(p.registeredAt)];
  });
  downloadCSV('participants.csv', [cols, ...rows]);
  showToast('CSV downloaded!', 'success');
}

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a   = document.createElement('a');
  a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
}

// ── Teams ──
function loadTeams() {
  filterTeams();
}

function filterTeams() {
  const status = document.getElementById('filterTeamStatus')?.value || '';
  const teams  = getTeams();
  const filtered = teams.filter(t => {
    if (!status) return true;
    const size = t.members.length;
    if (status === 'complete') return size >= 4;
    if (status === 'partial')  return size >= 2 && size < 4;
    if (status === 'solo')     return size === 1;
    return true;
  });
  renderTeams(filtered);
}

function renderTeams(teams) {
  const grid = document.getElementById('teamsGrid');
  if (!grid) return;
  if (!teams.length) {
    grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div><h3>No teams yet</h3><p>Teams will appear as participants register.</p></div>';
    return;
  }
  const participants = getAllParticipants();
  grid.innerHTML = teams.map(t => {
    const size = t.members.length;
    const sizeClass = size >= 4 ? 'size-complete' : (size >= 2 ? 'size-partial' : 'size-solo');
    const sizeLabel = `${size}/4`;
    const memberNames = t.members.map(mid => {
      const p = participants.find(x => x.id === mid);
      return p ? p.name : 'Unknown';
    });
    return `
      <div class="team-card">
        <div class="team-card-header">
          <div class="team-card-name">${esc(t.name)}</div>
          <span class="team-size-pill ${sizeClass}">${sizeLabel}</span>
        </div>
        <div class="team-card-track">${formatTrack(t.track)}</div>
        <div class="team-members-list">
          ${memberNames.map((n,i) => `
            <div class="team-member-row">
              <div class="member-avatar">${n[0]}</div>
              ${esc(n)} ${i===0?'<span style="color:var(--accent);font-size:0.7rem;margin-left:auto;">👑 Leader</span>':''}
            </div>`).join('')}
        </div>
        <div class="team-card-actions">
          <button class="table-action-btn" onclick="showTeamInvite('${t.inviteCode}')">🔗 Invite Link</button>
          <button class="table-action-btn danger" onclick="dissolveTeam('${t.id}')">Dissolve</button>
        </div>
      </div>`;
  }).join('');
}

function showTeamInvite(code) {
  const link = buildInviteLink(code);
  document.getElementById('modalContent').innerHTML = `
    <h2 style="font-family:var(--font-display);font-size:1rem;color:white;margin-bottom:1rem;">Team Invite Link</h2>
    <div class="invite-link-row" style="margin-bottom:0.8rem;">
      <input type="text" value="${link}" readonly style="flex:1;background:var(--glass);border:1px solid var(--glass-border);border-radius:8px;padding:0.6rem;color:var(--accent);font-family:monospace;font-size:0.8rem;outline:none;" />
      <button class="copy-btn" onclick="navigator.clipboard.writeText('${link}').then(()=>showToast('Copied!','success'))">📋 Copy</button>
    </div>
    <p style="color:var(--text-dim);font-size:0.82rem;">Code: <code style="background:rgba(108,99,255,0.15);padding:0.15rem 0.5rem;border-radius:4px;color:var(--accent);">${code}</code></p>
  `;
  show('participantModal');
}

function dissolveTeam(id) {
  openConfirm('Dissolve Team', 'This will remove the team. Members will become solo participants.', () => {
    let teams = getTeams().filter(t => t.id !== id);
    DB.set('teams', teams);
    let ps = DB.get('participants') || [];
    ps = ps.map(p => p.teamId === id ? { ...p, teamId: null } : p);
    DB.set('participants', ps);
    allParticipants = ps;
    loadTeams();
    showToast('Team dissolved.', 'success');
  });
}

function exportTeamsCSV() {
  const teams = getTeams();
  const cols  = ['Team Name','Track','Members','Size','Invite Code','Created'];
  const rows  = teams.map(t => [t.name, t.track, t.members.length, t.members.length, t.inviteCode, formatDate(t.createdAt)]);
  downloadCSV('teams.csv', [cols, ...rows]);
  showToast('Teams CSV downloaded!', 'success');
}

// ── Announcements ──
function loadAnnouncements() {
  renderAnnouncementsList();
}

function postAnnouncement() {
  const title = document.getElementById('ann-title').value.trim();
  const body  = document.getElementById('ann-body').value.trim();
  const type  = document.getElementById('ann-type').value;

  if (!title || !body) { showToast('Fill in title and message.', 'error'); return; }

  const ann = { id: 'a_' + Date.now(), title, body, type, createdAt: new Date().toISOString(), emailSent: document.getElementById('ann-email').checked };
  DB.push('announcements', ann);

  document.getElementById('ann-title').value = '';
  document.getElementById('ann-body').value  = '';
  renderAnnouncementsList();
  showToast('Announcement posted!', 'success');
}

function renderAnnouncementsList() {
  const list = document.getElementById('announcementsList');
  if (!list) return;
  const anns = (DB.get('announcements') || []).reverse();
  if (!anns.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📢</div><h3>No announcements yet</h3></div>';
    return;
  }
  list.innerHTML = anns.map(a => `
    <div class="ann-item" id="ann-${a.id}">
      <div class="ann-type-dot ${a.type}"></div>
      <div style="flex:1">
        <div class="ann-title">${esc(a.title)}</div>
        <div class="ann-body">${esc(a.body)}</div>
        <div class="ann-meta">${a.emailSent ? '✉️ Emailed · ' : ''}${relTime(a.createdAt)}</div>
      </div>
      <button class="ann-delete" onclick="deleteAnn('${a.id}')">🗑</button>
    </div>`).join('');
}

function deleteAnn(id) {
  let anns = DB.get('announcements') || [];
  anns = anns.filter(a => a.id !== id);
  DB.set('announcements', anns);
  renderAnnouncementsList();
}

// ── Rounds ──
function viewRound1Entries() {
  showPanel('participants', document.querySelector('[data-panel="participants"]'));
  showToast('Showing all Round 1 participants.', 'info');
}

function confirmCloseRound1() {
  openConfirm('Close Round 1', 'This will close Round 1 submissions and enable team shortlisting for Round 2.', () => {
    document.getElementById('shortlistBtn').disabled = false;
    document.getElementById('r2EmailBtn').disabled   = false;
    document.querySelector('.active-round .status-pill').textContent = 'Closed';
    document.querySelector('.active-round .status-pill').classList.replace('active','locked');
    showToast('Round 1 closed. You can now shortlist teams for Round 2.', 'success');
  });
}

function shortlistTeams() {
  openConfirm('Shortlist Teams', 'Mark top teams as shortlisted for Round 2 (Offline)?', () => {
    showToast('Teams shortlisted! Send invites to notify them.', 'success');
  });
}

function sendRound2Emails() {
  openConfirm('Send Round 2 Invites', 'Send offline round invites to all shortlisted teams?', () => {
    showToast('📧 Round 2 invites sent to shortlisted teams!', 'success');
  });
}

// ── Settings ──
function saveSetting(key, val) {
  const settings = DB.get('settings') || {};
  settings[key] = val;
  DB.set('settings', settings);
}

function saveSettings() {
  const settings = {
    eventName:    document.getElementById('eventName').value,
    r1EndDate:    document.getElementById('r1EndDate').value,
    adminEmail:   document.getElementById('adminEmail').value,
    maxTeamSize:  parseInt(document.getElementById('maxTeamSize').value),
    minTeamSize:  parseInt(document.getElementById('minTeamSize').value),
    registration: document.getElementById('toggle-reg').checked,
    invites:      document.getElementById('toggle-invites').checked,
  };
  DB.set('settings', settings);
  showToast('Settings saved!', 'success');
}

// ── Global search ──
function globalSearchFn(val) {
  if (!val.trim()) return;
  // Switch to participants panel and search there
  showPanel('participants', document.querySelector('[data-panel="participants"]'));
  const inp = document.getElementById('participantSearch');
  if (inp) { inp.value = val; filterParticipants(); }
}

// ── Modals ──
function openConfirm(title, msg, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent   = msg;
  const btn = document.getElementById('confirmAction');
  btn.onclick = () => { closeModal('confirmModal'); onConfirm(); };
  show('confirmModal');
}

function closeModal(id) { hide(id); }

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});

// ── Utilities ──
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function formatTrack(t) {
  const map = { ai:'🤖 AI & ML', web3:'⛓️ Web3', health:'🏥 HealthTech', climate:'🌱 Climate', gamefi:'🎮 GameFi', open:'🔓 Open' };
  return map[t] || t;
}
function formatTrackShort(t) {
  const map = { ai:'AI/ML', web3:'Web3', health:'Health', climate:'Climate', gamefi:'GameFi', open:'Open' };
  return map[t] || t;
}
function formatLevel(l) {
  const map = { beginner:'🌱 Beginner', intermediate:'⚡ Intermediate', advanced:'🔥 Advanced' };
  return map[l] || l;
}
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

/* ═══════════════════════════════════════════════════════════════
   PROBLEM STATEMENTS
═══════════════════════════════════════════════════════════════ */
const TRACK_MAP = {
  ai:'🤖 AI & ML', web3:'⛓️ Web3', health:'🏥 HealthTech',
  climate:'🌱 Climate', gamefi:'🎮 GameFi', open:'🔓 Open'
};

function loadProblemStatements() {
  renderPSList();
}

function addProblemStatement() {
  const text   = document.getElementById('ps-text').value.trim();
  const track  = document.getElementById('ps-track').value;
  const source = document.getElementById('ps-source').value.trim();

  if (!text) { showToast('Please write a problem statement.', 'error'); return; }

  const ps = {
    id: 'ps_' + Date.now(),
    track, text, source,
    active: true,
    createdAt: new Date().toISOString()
  };

  const all = getProblemStatements();
  all.push(ps);
  saveProblemStatements(all);

  document.getElementById('ps-text').value   = '';
  document.getElementById('ps-source').value = '';
  renderPSList();
  showToast(`Problem statement added to ${TRACK_MAP[track]} track!`, 'success', 4000);
  // Nudge user to preview
  showToast('💡 Open the site to see it live under the track card.', 'info', 4500);
}

function renderPSList() {
  const container  = document.getElementById('psList');
  if (!container) return;

  const filter = document.getElementById('psFilterTrack')?.value || '';
  const all    = getProblemStatements();
  const list   = filter ? all.filter(p => p.track === filter) : all;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No problem statements yet</h3>
        <p>Add your first problem statement above — it will appear live on the homepage.</p>
      </div>`;
    return;
  }

  // Group by track for display
  const byTrack = {};
  list.forEach(ps => {
    if (!byTrack[ps.track]) byTrack[ps.track] = [];
    byTrack[ps.track].push(ps);
  });

  container.innerHTML = Object.entries(byTrack).map(([trackKey, items]) => `
    <div style="margin-bottom:1.5rem;">
      <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem;">
        <span style="font-family:var(--font-display);font-size:0.82rem;font-weight:700;color:var(--accent);">${TRACK_MAP[trackKey]||trackKey}</span>
        <span style="background:rgba(0,245,212,0.1);border:1px solid rgba(0,245,212,0.25);color:var(--accent);font-size:0.68rem;padding:1px 7px;border-radius:50px;">${items.length}</span>
      </div>
      ${items.map(ps => `
        <div class="ps-admin-item ${ps.active===false?'inactive':''}">
          <div class="ps-track-dot ${trackKey}"></div>
          <div class="ps-main">
            <div class="ps-text-val">${esc(ps.text)}</div>
            <div class="ps-meta-row">
              <span class="ps-track-label">${TRACK_MAP[trackKey]||trackKey}</span>
              ${ps.source ? `<span class="ps-source-label">📌 ${esc(ps.source)}</span>` : ''}
              <span class="ps-time-label">${relTime(ps.createdAt)}</span>
            </div>
          </div>
          <div class="ps-actions">
            <button class="table-action-btn" onclick="togglePSActive('${ps.id}')" title="${ps.active===false?'Enable':'Disable'}">
              ${ps.active===false ? '▶ Enable' : '⏸ Hide'}
            </button>
            <button class="table-action-btn danger" onclick="deleteProblemStatement('${ps.id}')">🗑</button>
          </div>
        </div>`).join('')}
    </div>`).join('');
}

function togglePSActive(id) {
  const all = getProblemStatements();
  const ps  = all.find(p => p.id === id);
  if (!ps) return;
  ps.active = ps.active === false ? true : false;
  saveProblemStatements(all);
  renderPSList();
  showToast(ps.active ? 'Statement shown on homepage.' : 'Statement hidden from homepage.', 'info');
}

function deleteProblemStatement(id) {
  openConfirm('Delete Problem Statement', 'This will permanently remove the problem statement from the homepage.', () => {
    const updated = getProblemStatements().filter(p => p.id !== id);
    saveProblemStatements(updated);
    renderPSList();
    showToast('Problem statement deleted.', 'success');
  });
}

/* ═══════════════════════════════════════════════════════════════
   PRIZES
═══════════════════════════════════════════════════════════════ */
function loadPrizes() {
  renderMainPrizesEditor();
  renderTrackPrizesEditor();
}

function renderMainPrizesEditor() {
  const ed = document.getElementById('mainPrizesEditor');
  if (!ed) return;
  const data = getPrizes();

  ed.innerHTML = data.main.map((p, i) => `
    <div class="prize-editor-row">
      <div class="pe-field">
        <span class="pe-label">Rank</span>
        <input class="pe-input" id="mp-rank-${i}" value="${esc(p.rank)}" placeholder="e.g. 1st" />
      </div>
      <div class="pe-field">
        <span class="pe-label">Label</span>
        <input class="pe-input" id="mp-label-${i}" value="${esc(p.label)}" placeholder="Grand Prize" />
      </div>
      <div class="pe-field">
        <span class="pe-label">Amount</span>
        <input class="pe-input" id="mp-amount-${i}" value="${esc(p.amount)}" placeholder="$150,000" />
      </div>
      <div class="pe-field">
        <span class="pe-label">Trophy Emoji</span>
        <input class="pe-input" id="mp-trophy-${i}" value="${esc(p.trophy)}" placeholder="🏆" style="font-size:1.2rem;" />
      </div>
      <div class="pe-field">
        <span class="pe-label">Perks <small style="text-transform:none;font-weight:400;">(comma sep.)</small></span>
        <input class="pe-input" id="mp-perks-${i}" value="${p.perks.map(pk=>esc(pk)).join(', ')}" placeholder="Cash Prize, VC Meetings" />
      </div>
    </div>`).join('');
}

function saveMainPrizes() {
  const data  = getPrizes();
  data.main   = data.main.map((p, i) => ({
    ...p,
    rank:   document.getElementById(`mp-rank-${i}`).value.trim()   || p.rank,
    label:  document.getElementById(`mp-label-${i}`).value.trim()  || p.label,
    amount: document.getElementById(`mp-amount-${i}`).value.trim() || p.amount,
    trophy: document.getElementById(`mp-trophy-${i}`).value.trim() || p.trophy,
    perks:  document.getElementById(`mp-perks-${i}`).value.split(',').map(s => s.trim()).filter(Boolean),
  }));
  savePrizes(data);
  showToast('Prize podium saved! Reload the homepage to see changes.', 'success', 4000);
}

function renderTrackPrizesEditor() {
  const ed = document.getElementById('trackPrizesEditor');
  if (!ed) return;
  const data = getPrizes();

  ed.innerHTML = data.tracks.map((tp, i) => `
    <div class="track-prize-row">
      <div class="pe-field">
        <span class="pe-label">Track</span>
        <input class="pe-input" id="tp-track-${i}" value="${esc(tp.track)}" placeholder="🤖 AI/ML" />
      </div>
      <div class="pe-field">
        <span class="pe-label">Amount</span>
        <input class="pe-input" id="tp-amount-${i}" value="${esc(tp.amount)}" placeholder="$10,000" />
      </div>
      <button class="table-action-btn danger" style="margin-bottom:2px;" onclick="removeTrackPrize(${i})" title="Remove">✕</button>
    </div>`).join('') + `
    <button class="admin-btn" style="margin-top:0.5rem;" onclick="addTrackPrize()">➕ Add Track Prize</button>`;
}

function saveTrackPrizes() {
  const data = getPrizes();
  data.tracks = data.tracks.map((tp, i) => ({
    track:  document.getElementById(`tp-track-${i}`).value.trim()  || tp.track,
    amount: document.getElementById(`tp-amount-${i}`).value.trim() || tp.amount,
  }));
  savePrizes(data);
  renderTrackPrizesEditor();
  showToast('Track prizes saved! Reload the homepage to see changes.', 'success', 4000);
}

function addTrackPrize() {
  const data = getPrizes();
  data.tracks.push({ track:'New Track', amount:'$5,000' });
  savePrizes(data);
  renderTrackPrizesEditor();
}

function removeTrackPrize(i) {
  const data = getPrizes();
  data.tracks.splice(i, 1);
  savePrizes(data);
  renderTrackPrizesEditor();
  showToast('Track prize removed.', 'info');
}

function resetPrizesToDefault() {
  openConfirm('Reset Prizes', 'This will restore all prizes to their default values. Continue?', () => {
    DB.set('prizes', null);
    loadPrizes();
    showToast('Prizes reset to defaults.', 'success');
  });
}

/* ═══════════════════════════════════════════════════════════════
   SPONSORS
═══════════════════════════════════════════════════════════════ */
function loadSponsors() {
  renderSponsorList();
}

function addSponsor() {
  const name = document.getElementById('sp-name').value.trim();
  const tier = document.getElementById('sp-tier').value;
  const url  = document.getElementById('sp-url').value.trim();
  const desc = document.getElementById('sp-desc').value.trim();

  if (!name) { showToast('Sponsor name is required.', 'error'); return; }

  const sponsor = {
    id:     'sp_' + Date.now(),
    name, tier, url, desc,
    active: true,
    addedAt: new Date().toISOString()
  };

  const all = getSponsors();
  all.push(sponsor);
  saveSponsors(all);

  document.getElementById('sp-name').value = '';
  document.getElementById('sp-url').value  = '';
  document.getElementById('sp-desc').value = '';
  renderSponsorList();
  showToast(`Sponsor "${name}" added! It will appear in the homepage marquee.`, 'success', 4000);
}

function renderSponsorList() {
  const container = document.getElementById('sponsorAdminList');
  if (!container) return;

  const filter = document.getElementById('spFilterTier')?.value || '';
  const all    = getSponsors();
  const list   = filter ? all.filter(s => s.tier === filter) : all;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">🤝</div>
        <h3>No sponsors yet</h3>
        <p>Add a sponsor above — they'll appear in the homepage marquee and grid.</p>
      </div>`;
    return;
  }

  const tierLabel = { gold:'🥇 Gold', silver:'🥈 Silver', bronze:'🥉 Bronze' };

  container.innerHTML = list.map(s => `
    <div class="sponsor-card ${s.active===false?'inactive':''}">
      <div class="sponsor-card-header">
        <span class="sponsor-name-big">${esc(s.name)}</span>
        <span class="sponsor-tier-pill tier-${s.tier}">${tierLabel[s.tier]||s.tier}</span>
      </div>
      ${s.desc ? `<div class="sponsor-desc">${esc(s.desc)}</div>` : ''}
      ${s.url  ? `<a href="${esc(s.url)}" target="_blank" class="sponsor-url">🔗 ${esc(s.url)}</a>` : ''}
      <div class="active-toggle">
        <label class="toggle-switch" style="width:36px;height:18px;">
          <input type="checkbox" ${s.active!==false?'checked':''} onchange="toggleSponsorActive('${s.id}',this.checked)" />
          <span class="toggle-slider"></span>
        </label>
        <span>${s.active!==false?'Visible on site':'Hidden'}</span>
      </div>
      <div class="sponsor-card-actions">
        <button class="table-action-btn" onclick="editSponsorTier('${s.id}')">✏️ Edit Tier</button>
        <button class="table-action-btn danger" onclick="deleteSponsor('${s.id}')">🗑 Remove</button>
      </div>
    </div>`).join('');
}

function toggleSponsorActive(id, active) {
  const all = getSponsors();
  const sp  = all.find(s => s.id === id);
  if (!sp) return;
  sp.active = active;
  saveSponsors(all);
  renderSponsorList();
  showToast(active ? `"${sp.name}" is now visible on site.` : `"${sp.name}" hidden from site.`, 'info');
}

function editSponsorTier(id) {
  const all  = getSponsors();
  const sp   = all.find(s => s.id === id);
  if (!sp) return;
  const tiers = ['gold','silver','bronze'];
  const idx   = tiers.indexOf(sp.tier);
  sp.tier     = tiers[(idx + 1) % tiers.length];
  saveSponsors(all);
  renderSponsorList();
  showToast(`"${sp.name}" tier changed to ${sp.tier}.`, 'info');
}

function deleteSponsor(id) {
  const sp = getSponsors().find(s => s.id === id);
  openConfirm('Remove Sponsor', `Remove "${sp ? sp.name : 'this sponsor'}" from the homepage?`, () => {
    const updated = getSponsors().filter(s => s.id !== id);
    saveSponsors(updated);
    renderSponsorList();
    showToast('Sponsor removed.', 'success');
  });
}
