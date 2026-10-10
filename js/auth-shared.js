/* ==================== AUTH-SHARED.JS ==================== */
/* Shared utilities for register.html, login.html, admin.html */

// ── Custom Cursor ──
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');
if (cursor && cursorFollower) {
  let mx = 0, my = 0, fx = 0, fy = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });
  (function animFollower() {
    fx += (mx - fx) * 0.12;
    fy += (my - fy) * 0.12;
    cursorFollower.style.left = fx + 'px';
    cursorFollower.style.top  = fy + 'px';
    requestAnimationFrame(animFollower);
  })();
  document.querySelectorAll('a,button,.level-option,.team-choice-btn,.social-btn').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.classList.add('hovered'); cursorFollower.classList.add('hovered'); });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('hovered'); cursorFollower.classList.remove('hovered'); });
  });
}

// ── Background Canvas (auth pages) ──
const authCanvas = document.getElementById('authCanvas');
if (authCanvas) {
  const ctx = authCanvas.getContext('2d');
  authCanvas.width  = window.innerWidth;
  authCanvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    authCanvas.width  = window.innerWidth;
    authCanvas.height = window.innerHeight;
  });
  const pts = Array.from({ length: 60 }, () => ({
    x:  Math.random() * authCanvas.width,
    y:  Math.random() * authCanvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r:  Math.random() * 1.5 + 0.5,
    a:  Math.random() * 0.4 + 0.1,
    c:  Math.random() > 0.5 ? '108,99,255' : '0,245,212'
  }));
  (function animAuth() {
    ctx.clearRect(0, 0, authCanvas.width, authCanvas.height);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > authCanvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > authCanvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${p.a})`;
      ctx.fill();
    });
    // connections
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(108,99,255,${(1-d/110)*0.15})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animAuth);
  })();
}

// ── Toggle password visibility ──
function togglePw(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = '🙈';
  } else {
    inp.type = 'password';
    btn.textContent = '👁';
  }
}

// ── Show / hide element ──
function show(id) { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); }
function hide(id) { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }

// ── Toast notifications ──
function ensureToastContainer() {
  let tc = document.getElementById('toastContainer');
  if (!tc) {
    tc = document.createElement('div');
    tc.id = 'toastContainer';
    tc.className = 'toast-container';
    document.body.appendChild(tc);
  }
  return tc;
}
function showToast(msg, type = 'info', duration = 3500) {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  const tc = ensureToastContainer();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  tc.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

// ── LocalStorage helpers ──
const DB = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem('hf_' + key)); } catch { return null; }
  },
  set: (key, val) => {
    try { localStorage.setItem('hf_' + key, JSON.stringify(val)); } catch {}
  },
  push: (key, item) => {
    const arr = DB.get(key) || [];
    arr.push(item);
    DB.set(key, arr);
    return arr;
  }
};

// ── Auth helpers ──
const DEMO_USERS = [
  { email: 'hacker@hackfusion.dev', password: 'hackfusion2026', name: 'Demo Hacker', role: 'participant', teamId: null },
  { email: 'admin@hackfusion.dev',  password: 'admin123',        name: 'Admin',       role: 'admin',       teamId: null }
];

function getUsers() {
  return [...DEMO_USERS, ...(DB.get('users') || [])];
}

function findUser(email, password) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
}

function getCurrentUser() {
  return DB.get('currentUser');
}

function setCurrentUser(user) {
  // don't persist passwords
  const safe = { ...user };
  delete safe.password;
  DB.set('currentUser', safe);
}

function logout() {
  DB.set('currentUser', null);
}

// ── Team helpers ──
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function buildInviteLink(code) {
  const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
  return `${base}register.html?invite=${code}`;
}

function getTeams() {
  return DB.get('teams') || [];
}

function getTeamById(id) {
  return getTeams().find(t => t.id === id);
}

function getTeamByCode(code) {
  return getTeams().find(t => t.inviteCode === code.toUpperCase());
}

function saveTeam(team) {
  const teams = getTeams();
  const idx = teams.findIndex(t => t.id === team.id);
  if (idx >= 0) teams[idx] = team;
  else teams.push(team);
  DB.set('teams', teams);
}

// ── Sponsors helpers ──
function getSponsors() { return DB.get('sponsors') || []; }
function saveSponsors(arr) { DB.set('sponsors', arr); }

// ── Prizes helpers ──
function getPrizes() {
  return DB.get('prizes') || {
    main: [
      { rank:'1ST PLACE', label:'Grand Prize',   amount:'₹40,000', trophy:'🏆', class:'first',  crown:true,  perks:['₹40,000 Cash Prize','Winner Certificate of Excellence','Grand Hackathon Trophy','Direct Mentorship & Incubation'] },
      { rank:'2ND PLACE', label:'Runner Up',     amount:'₹25,000', trophy:'🥈', class:'second', crown:false, perks:['₹25,000 Cash Prize','Runner-up Certificate of Merit','Mentorship & Cloud Credits','Exclusive Swag Kit'] },
      { rank:'3RD PLACE', label:'Third Place',   amount:'₹15,000', trophy:'🥉', class:'third',  crown:false, perks:['₹15,000 Cash Prize','Certificate of Achievement','Cloud Credits & Swag Kit'] },
    ],
    tracks: [
      { track:'🌟 Best Innovation · Track 1', amount:'₹5,000' },
      { track:'🌟 Best Innovation · Track 2', amount:'₹5,000' },
      { track:'🌱 Best Social Impact Project', amount:'₹5,000' },
      { track:'🎨 Best UI / UX & Design', amount:'₹5,000' },
    ]
  };
}
function savePrizes(data) { DB.set('prizes', data); }

// ── Problem Statement helpers ──
function getProblemStatements() { return DB.get('problemStatements') || []; }
function saveProblemStatements(arr) { DB.set('problemStatements', arr); }

// ── Seed demo data if empty ──
(function seedDemoData() {
  if (DB.get('seeded')) return;
  const demoParticipants = [
    { id: 'u1', name: 'Alice Wang',     email: 'alice@demo.com',   college: 'MIT',           track: 'ai',     level: 'advanced',     teamId: 't1', registeredAt: '2026-08-05T10:30:00Z' },
    { id: 'u2', name: 'Bob Martinez',   email: 'bob@demo.com',     college: 'Stanford',      track: 'web3',   level: 'intermediate', teamId: 't1', registeredAt: '2026-08-06T14:20:00Z' },
    { id: 'u3', name: 'Chloe Singh',    email: 'chloe@demo.com',   college: 'IIT Bombay',    track: 'ai',     level: 'intermediate', teamId: 't1', registeredAt: '2026-08-07T09:15:00Z' },
    { id: 'u4', name: 'Dev Patel',      email: 'dev@demo.com',     college: 'BITS Pilani',   track: 'health', level: 'beginner',     teamId: 't2', registeredAt: '2026-08-08T16:00:00Z' },
    { id: 'u5', name: 'Emma Koch',      email: 'emma@demo.com',    college: 'TU Berlin',     track: 'climate',level: 'advanced',     teamId: 't2', registeredAt: '2026-08-09T11:45:00Z' },
    { id: 'u6', name: 'Farhan Ali',     email: 'farhan@demo.com',  college: 'NUST',          track: 'open',   level: 'intermediate', teamId: 't3', registeredAt: '2026-08-10T13:30:00Z' },
    { id: 'u7', name: 'Gia Nguyen',     email: 'gia@demo.com',     college: 'NUS',           track: 'gamefi', level: 'advanced',     teamId: 't3', registeredAt: '2026-08-11T08:20:00Z' },
    { id: 'u8', name: 'Hamid Bakr',     email: 'hamid@demo.com',   college: 'Cairo Univ',    track: 'web3',   level: 'beginner',     teamId: null, registeredAt: '2026-08-12T17:10:00Z' },
    { id: 'u9', name: 'Iris Chen',      email: 'iris@demo.com',    college: 'Peking Univ',   track: 'ai',     level: 'advanced',     teamId: 't4', registeredAt: '2026-08-13T10:05:00Z' },
    { id:'u10', name: 'Jake O\'Brien',  email: 'jake@demo.com',    college: 'UCL',           track: 'health', level: 'intermediate', teamId: 't4', registeredAt: '2026-08-14T12:00:00Z' },
    { id:'u11', name: 'Kavya Reddy',    email: 'kavya@demo.com',   college: 'IIIT Hyd',      track: 'ai',     level: 'advanced',     teamId: 't4', registeredAt: '2026-08-15T09:30:00Z' },
    { id:'u12', name: 'Leo Fischer',    email: 'leo@demo.com',     college: 'ETH Zurich',    track: 'climate',level: 'intermediate', teamId: 't4', registeredAt: '2026-08-16T14:50:00Z' },
  ];
  const demoTeams = [
    { id: 't1', name: 'ByteForce',    track: 'ai',     leaderId: 'u1', members: ['u1','u2','u3'],        inviteCode: 'BYT3F0', createdAt: '2026-08-05T10:32:00Z' },
    { id: 't2', name: 'GreenBits',    track: 'climate',leaderId: 'u4', members: ['u4','u5'],              inviteCode: 'GRN88B', createdAt: '2026-08-08T16:05:00Z' },
    { id: 't3', name: 'MetaCoders',   track: 'gamefi', leaderId: 'u6', members: ['u6','u7'],              inviteCode: 'MTA9XZ', createdAt: '2026-08-10T13:35:00Z' },
    { id: 't4', name: 'HealthPixels', track: 'health', leaderId: 'u9', members: ['u9','u10','u11','u12'], inviteCode: 'HLT4PX', createdAt: '2026-08-13T10:10:00Z' },
  ];
  DB.set('participants', demoParticipants);
  DB.set('teams', demoTeams);

  // ── Seed sponsors (Verified sponsors only) ──
  const demoSponsors = [
    { id:'sp1', name:'VRIF, VTU Belagavi', tier:'gold',   role:'Collaborator',      url:'https://vtuvrif.org/',                      desc:'VTU Research and Innovation Foundation.', active:true },
    { id:'sp2', name:'3LC.ai',             tier:'gold',   role:'Title Sponsor',     url:'https://3lc.ai/',                           desc:'AI optimization and dataset curation tools.', active:true },
    { id:'sp3', name:'Unstop',             tier:'silver', role:'Powered By',        url:'https://unstop.com/',                       desc:'Global talent engagement and hackathon platform.', active:true },
    { id:'sp4', name:'Gen.xyz',            tier:'silver', role:'Domain Sponsor',    url:'https://gen.xyz/',                          desc:'Free domain names for hackers.', active:true },
    { id:'sp5', name:'Lenienttree',        tier:'bronze', role:'Listing Sponsor',   url:'https://lenienttree.com/',                  desc:'Tech innovation partner.', active:true },
    { id:'sp6', name:'TruScholar',         tier:'bronze', role:'Credential Partner',url:'https://www.truscholar.io/',               desc:'Digital verifiable certificates and badges.', active:true },
    { id:'sp7', name:'SBI Life',           tier:'bronze', role:'Goodies Sponsor',   url:'https://sangamesh991075469.lifemitra.com/', desc:'Event goodies and participant support.', active:true },
  ];
  DB.set('sponsors', demoSponsors);

  // ── Seed problem statements ──
  const demoProblemStatements = [
    { id:'ps1',  track:'ai',     text:'Build an AI system that detects early signs of misinformation in social media posts with >90% accuracy.',          source:'Google',    active:true, createdAt:'2026-08-01T10:00:00Z' },
    { id:'ps2',  track:'ai',     text:'Create a real-time code review assistant that identifies security vulnerabilities using LLMs.',                    source:'Microsoft', active:true, createdAt:'2026-08-02T10:00:00Z' },
    { id:'ps3',  track:'ai',     text:'Design a personalised learning path generator for students using adaptive ML models.',                             source:'',          active:true, createdAt:'2026-08-03T10:00:00Z' },
    { id:'ps4',  track:'web3',   text:'Develop a decentralised identity verification system that preserves user privacy using zero-knowledge proofs.',    source:'OpenAI',    active:true, createdAt:'2026-08-01T11:00:00Z' },
    { id:'ps5',  track:'web3',   text:'Build an on-chain governance dashboard for DAOs that visualises voting power and proposal history.',              source:'',          active:true, createdAt:'2026-08-04T10:00:00Z' },
    { id:'ps6',  track:'health', text:'Create a wearable-data pipeline that predicts stress levels and suggests personalised interventions in real time.', source:'Meta',      active:true, createdAt:'2026-08-01T12:00:00Z' },
    { id:'ps7',  track:'health', text:'Build an AI-powered symptom checker that can triage patients and recommend specialist referrals.',                 source:'',          active:true, createdAt:'2026-08-05T10:00:00Z' },
    { id:'ps8',  track:'climate',text:'Design a carbon footprint tracker for SMEs that integrates with accounting software to auto-calculate emissions.', source:'AWS',       active:true, createdAt:'2026-08-01T13:00:00Z' },
    { id:'ps9',  track:'climate',text:'Build an optimisation engine for EV charging schedules using renewable energy availability forecasts.',           source:'',          active:true, createdAt:'2026-08-06T10:00:00Z' },
    { id:'ps10', track:'gamefi', text:'Create a play-to-earn game with on-chain asset ownership that works on mobile with sub-second transaction times.', source:'Stripe',    active:true, createdAt:'2026-08-01T14:00:00Z' },
    { id:'ps11', track:'open',   text:'Build any tool that meaningfully improves developer productivity — no constraints on stack or domain.',            source:'GitHub',    active:true, createdAt:'2026-08-01T15:00:00Z' },
    { id:'ps12', track:'open',   text:'Create a platform that connects rural communities with last-mile delivery and logistics services.',               source:'',          active:true, createdAt:'2026-08-07T10:00:00Z' },
  ];
  DB.set('problemStatements', demoProblemStatements);

  DB.set('seeded', true);
})();
