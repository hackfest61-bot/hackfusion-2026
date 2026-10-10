/* ==================== REGISTER.JS ==================== */

let currentStep = 1;
let registrationData = {};
let createdTeam = null;
let joinedTeam  = null;
let teamMode = 'create'; // 'create' | 'join'

// ── Check for invite link on load ──
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const inviteCode = params.get('invite');
  if (inviteCode) {
    switchTeamMode('join');
    const input = document.getElementById('join-code');
    if (input) {
      input.value = inviteCode;
      lookupTeamCode(inviteCode);
    }
  }

  // Password strength meter
  const pwInput = document.getElementById('reg-password');
  if (pwInput) pwInput.addEventListener('input', checkPasswordStrength);

  // Team name character counter
  const tnInput = document.getElementById('team-name');
  if (tnInput) tnInput.addEventListener('input', () => {
    const cnt = document.getElementById('teamNameCount');
    if (cnt) cnt.textContent = tnInput.value.length + '/30';
  });

  // Level selector
  document.querySelectorAll('.level-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.level-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      document.getElementById('reg-level').value = opt.dataset.level;
    });
  });

  // Join code live lookup
  const joinInput = document.getElementById('join-code');
  if (joinInput) joinInput.addEventListener('input', e => {
    const v = e.target.value.trim();
    if (v.length >= 6) lookupTeamCode(v);
    else hide('teamPreview');
  });

  // Personal form submit
  document.getElementById('personalForm').addEventListener('submit', e => {
    e.preventDefault();
    if (validateStep1()) goToStep(2);
  });
});

// ── Step navigation ──
function goToStep(n) {
  if (n === 2 && currentStep === 1 && !validateStep1()) return;
  if (n === 3 && currentStep === 2 && !validateStep2()) return;

  currentStep = n;

  // Hide all steps
  ['step1','step2','step3'].forEach(id => hide(id));
  show('step' + n);

  // Update progress bar
  updateStepProgress(n);

  if (n === 3) buildConfirmSummary();

  // Animate card
  const card = document.getElementById('step' + n);
  if (card) {
    card.style.animation = 'none';
    card.offsetHeight; // reflow
    card.style.animation = 'cardSlideIn 0.5s cubic-bezier(0.16,1,0.3,1) both';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepProgress(activeStep) {
  document.querySelectorAll('.step-item').forEach(item => {
    const s = parseInt(item.dataset.step);
    item.classList.remove('active', 'done');
    if (s === activeStep) item.classList.add('active');
    if (s < activeStep)   item.classList.add('done');
    // update circle for done steps
    const circle = item.querySelector('.step-circle');
    if (circle) circle.textContent = s < activeStep ? '✓' : s;
  });
  document.querySelectorAll('.step-line').forEach((line, i) => {
    line.classList.toggle('filled', (i + 1) < activeStep);
  });
}

// ── Validation ──
function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
  document.querySelectorAll('.input-wrap input, .input-wrap select').forEach(i => i.classList.remove('error'));
}
function markError(inputId, errId, msg) {
  const inp = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (inp) inp.classList.add('error');
  if (err) err.textContent = msg;
}

function validateStep1() {
  clearErrors();
  let ok = true;
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pw    = document.getElementById('reg-password').value;
  const pw2   = document.getElementById('reg-password2').value;
  const track = document.getElementById('reg-track').value;

  if (!name || name.length < 2) { markError('reg-name','err-name','Please enter your full name.'); ok = false; }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) { markError('reg-email','err-email','Enter a valid email address.'); ok = false; }
  if (!pw || pw.length < 8) { markError('reg-password','err-password','Password must be at least 8 characters.'); ok = false; }
  if (pw !== pw2) { markError('reg-password2','err-password2','Passwords do not match.'); ok = false; }
  if (!track) { markError('reg-track','err-track','Please select a track.'); ok = false; }

  // Check if email already registered
  if (ok) {
    const existing = (DB.get('users') || []).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) { markError('reg-email','err-email','This email is already registered.'); ok = false; }
  }

  if (ok) {
    registrationData = {
      id: 'u_' + Date.now(),
      name,
      email,
      password: pw,
      college: document.getElementById('reg-college').value.trim(),
      github:  document.getElementById('reg-github').value.trim(),
      track,
      level: document.getElementById('reg-level').value || 'beginner',
      role: 'participant',
      registeredAt: new Date().toISOString()
    };
  }
  return ok;
}

function validateStep2() {
  clearErrors();
  if (teamMode === 'create') {
    const name = document.getElementById('team-name').value.trim();
    if (!name || name.length < 2) {
      setError('err-teamname', 'Please enter a team name.');
      return false;
    }
    // Team must be created before proceeding
    if (!createdTeam) {
      setError('err-teamname', 'Click "Create Team & Get Invite Link" first.');
      return false;
    }
  } else {
    if (!joinedTeam) {
      setError('err-joincode', 'Please enter a valid invite code and join a team.');
      return false;
    }
  }
  return true;
}

// ── Password strength ──
function checkPasswordStrength() {
  const pw  = document.getElementById('reg-password').value;
  const bar = document.getElementById('pwBar');
  if (!bar) return;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const colors = ['#ff4444','#ff9f43','#f7ca45','#22c55e'];
  const widths  = ['25%','50%','75%','100%'];
  bar.style.width      = score ? widths[score-1] : '0%';
  bar.style.background = score ? colors[score-1] : '';
}

// ── Team mode switch ──
function switchTeamMode(mode) {
  teamMode = mode;
  const cc = document.getElementById('choiceCreate');
  const cj = document.getElementById('choiceJoin');
  const cp = document.getElementById('createTeamPanel');
  const jp = document.getElementById('joinTeamPanel');
  if (mode === 'create') {
    cc.classList.add('active'); cj.classList.remove('active');
    cp.classList.remove('hidden'); jp.classList.add('hidden');
  } else {
    cj.classList.add('active'); cc.classList.remove('active');
    jp.classList.remove('hidden'); cp.classList.add('hidden');
  }
}

// ── Create team ──
function createTeam() {
  clearErrors();
  const name = document.getElementById('team-name').value.trim();
  if (!name || name.length < 2) {
    setError('err-teamname', 'Enter a team name first.'); return;
  }
  if (!registrationData.email) {
    showToast('Complete Step 1 first!', 'error'); return;
  }

  const code = generateInviteCode();
  const link = buildInviteLink(code);

  createdTeam = {
    id: 't_' + Date.now(),
    name,
    description: document.getElementById('team-desc').value.trim(),
    track: registrationData.track,
    leaderId: registrationData.id,
    members: [registrationData.id],
    inviteCode: code,
    createdAt: new Date().toISOString()
  };
  saveTeam(createdTeam);

  // Show invite box
  document.getElementById('inviteLink').value = link;
  show('inviteBox');
  document.getElementById('createTeamBtn').innerHTML = '<span>✅ Team Created!</span>';
  document.getElementById('createTeamBtn').style.background = 'linear-gradient(135deg,#22c55e,#00f5d4)';

  showToast(`Team "${name}" created! Share your invite link.`, 'success');
}

// ── Copy invite link ──
function copyInviteLink() {
  const link = document.getElementById('inviteLink').value;
  navigator.clipboard.writeText(link).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✅ Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
    showToast('Invite link copied!', 'success');
  });
}

function copySuccessLink() {
  const link = document.getElementById('successInviteLink').value;
  navigator.clipboard.writeText(link).then(() => showToast('Link copied!', 'success'));
}

// ── Share buttons ──
function shareWhatsApp() {
  const link = document.getElementById('inviteLink').value;
  const msg  = `Join my HackFusion 2026 team! Use this link: ${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}
function shareEmail() {
  const link = document.getElementById('inviteLink').value;
  const sub  = 'Join my HackFusion 2026 team!';
  const body = `Hey,\n\nJoin my team for HackFusion 2026!\nUse this invite link to register and join: ${link}\n\nSee you there! 🚀`;
  window.location.href = `mailto:?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`;
}
function shareDiscord() {
  const link = document.getElementById('inviteLink').value;
  navigator.clipboard.writeText(`🚀 Join my HackFusion 2026 team! → ${link}`).then(() => showToast('Discord message copied! Paste it in your channel.', 'info'));
}

// ── Lookup team code for joining ──
function lookupTeamCode(codeOrLink) {
  // extract code from link if needed
  let code = codeOrLink;
  try {
    const u = new URL(codeOrLink);
    code = u.searchParams.get('invite') || codeOrLink;
  } catch {}
  code = code.trim().toUpperCase();

  const team = getTeamByCode(code);
  const preview = document.getElementById('teamPreview');
  const errEl   = document.getElementById('err-joincode');

  if (!team) {
    hide('teamPreview');
    if (errEl) errEl.textContent = 'Team not found. Check the code/link.';
    joinedTeam = null; return;
  }
  if (team.members.length >= 4) {
    hide('teamPreview');
    if (errEl) errEl.textContent = 'This team is full (max 4 members).';
    joinedTeam = null; return;
  }
  if (errEl) errEl.textContent = '';

  // Populate preview
  document.getElementById('previewTeamName').textContent = team.name;
  document.getElementById('previewTrack').textContent    = '🎯 ' + formatTrack(team.track);

  const membersEl = document.getElementById('previewMembers');
  const participants = DB.get('participants') || [];
  membersEl.innerHTML = team.members.map(mid => {
    const p = participants.find(x => x.id === mid);
    return `<div class="preview-member-chip">${p ? p.name : 'Member'}</div>`;
  }).join('');

  const slotsLeft = 4 - team.members.length;
  document.getElementById('previewSlots').textContent = `${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} remaining`;

  show('teamPreview');
  joinedTeam = team;
}

function joinTeam() {
  const code = (document.getElementById('join-code').value || '').trim();
  if (!code) { setError('err-joincode', 'Enter an invite code or link.'); return; }
  lookupTeamCode(code);
  if (!joinedTeam) return;

  // Add member
  joinedTeam.members.push(registrationData.id || 'temp_' + Date.now());
  saveTeam(joinedTeam);
  showToast(`Joined team "${joinedTeam.name}"!`, 'success');
}

// ── Confirm summary ──
function buildConfirmSummary() {
  const d = registrationData;
  const teamName = createdTeam ? createdTeam.name : (joinedTeam ? joinedTeam.name : 'Solo (no team yet)');

  const rows = [
    ['Name',       d.name],
    ['Email',      d.email],
    ['College',    d.college || '—'],
    ['Track',      formatTrack(d.track)],
    ['Level',      formatLevel(d.level)],
    ['GitHub',     d.github || '—'],
    ['Team',       teamName],
    ['Team Role',  createdTeam ? '👑 Team Leader' : (joinedTeam ? '👥 Member' : '—')],
  ];

  document.getElementById('confirmSummary').innerHTML = rows.map(([label, val]) =>
    `<div class="confirm-row">
       <span class="c-label">${label}</span>
       <span class="c-val">${val}</span>
     </div>`
  ).join('');
}

// ── Final submission ──
function submitRegistration() {
  const terms = document.getElementById('termsCheck').checked;
  const age   = document.getElementById('ageCheck').checked;
  if (!terms || !age) {
    setError('err-terms', 'Please accept both checkboxes to continue.');
    return;
  }

  // Save user
  const users = DB.get('users') || [];
  users.push(registrationData);
  DB.set('users', users);

  // Save participant entry
  DB.push('participants', {
    id: registrationData.id,
    name: registrationData.name,
    email: registrationData.email,
    college: registrationData.college || '',
    track: registrationData.track,
    level: registrationData.level,
    teamId: createdTeam ? createdTeam.id : (joinedTeam ? joinedTeam.id : null),
    registeredAt: registrationData.registeredAt,
    github: registrationData.github
  });

  // Set session
  setCurrentUser(registrationData);

  // Show success
  hide('step3');
  show('stepSuccess');

  document.getElementById('successName').textContent = registrationData.name;

  if (createdTeam) {
    document.getElementById('successTeamName').textContent = createdTeam.name;
    document.getElementById('successInviteLink').value = buildInviteLink(createdTeam.inviteCode);
    show('successInviteRow');
  } else if (joinedTeam) {
    document.getElementById('successTeamName').textContent = joinedTeam.name;
  }

  updateStepProgress(4); // all done

  // Confetti
  for (let i = 0; i < 80; i++) spawnConfetti();
}

function spawnConfetti() {
  const el = document.createElement('div');
  const colors = ['#6c63ff','#00f5d4','#ff6b9d','#ff9f43','#fff'];
  el.style.cssText = `
    position: fixed;
    top: ${-10 + Math.random() * 40}vh;
    left: ${Math.random() * 100}vw;
    width: ${Math.random() * 10 + 5}px;
    height: ${Math.random() * 10 + 5}px;
    background: ${colors[Math.floor(Math.random() * colors.length)]};
    border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    z-index: 9999;
    pointer-events: none;
    animation: confettiFall ${Math.random() * 2 + 1.5}s ease-out forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
// inject confetti keyframe
const cs = document.createElement('style');
cs.textContent = `
  @keyframes confettiFall {
    0%   { transform: translateY(0) rotate(0deg);    opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }`;
document.head.appendChild(cs);

// ── Helpers ──
function formatTrack(t) {
  const map = { ai:'🤖 AI & Machine Learning', web3:'⛓️ Web3 & Blockchain', health:'🏥 HealthTech', climate:'🌱 Climate', gamefi:'🎮 GameFi', open:'🔓 Open Innovation' };
  return map[t] || t;
}
function formatLevel(l) {
  const map = { beginner:'🌱 Beginner', intermediate:'⚡ Intermediate', advanced:'🔥 Advanced' };
  return map[l] || l;
}
