/* =====================================================================
   CANVAS-BG.JS  —  HackFusion 2026
   Full anime canvas background + multiple cartoon characters
   Characters: Ninja (mouse-reactive), Hacker Girl, Wizard, Robot,
               Cat Coder, Astronaut, Pixel Dragon, Chibi Developer
   ===================================================================== */
(function () {
  'use strict';

  /* ── Mount canvas ── */
  function mountCanvas(id) {
    let c = document.getElementById(id);
    if (!c) {
      c = document.createElement('canvas');
      c.id = id;
      document.body.insertAdjacentElement('afterbegin', c);
    }
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    return c;
  }

  const cvs = mountCanvas('globalCanvas');
  const ctx = cvs.getContext('2d');
  let W, H, mx = -999, my = -999;

  function resize() { W = cvs.width = window.innerWidth; H = cvs.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  /* ── Palette ── */
  const P = ['rgba(124,106,255,', 'rgba(0,229,200,', 'rgba(255,95,160,', 'rgba(255,169,64,', 'rgba(78,169,255,'];

  /* ═══════════════════════════════════════════════════════
     BACKGROUND LAYERS
  ═══════════════════════════════════════════════════════ */

  /* Stars */
  const STARS = Array.from({ length: 240 }, () => ({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.5 + .2,
    a: Math.random() * .7 + .1,
    sp: Math.random() * .009 + .002,
    ph: Math.random() * Math.PI * 2
  }));

  /* Sakura petals */
  function mkPetal() {
    return {
      x: Math.random() * (W || 1920), y: -30 - Math.random() * 200,
      sz: Math.random() * 10 + 4,
      rot: Math.random() * Math.PI * 2, rs: (Math.random() - .5) * .06,
      vx: (Math.random() - .5) * .9, vy: Math.random() * .95 + .3,
      al: Math.random() * .55 + .15,
      col: Math.random() > .5 ? 'rgba(255,95,160,' : 'rgba(124,106,255,'
    };
  }
  const petals = Array.from({ length: 35 }, mkPetal);

  /* Circuit nodes */
  const nodes = Array.from({ length: 100 }, () => ({
    x: Math.random() * (W || 1920), y: Math.random() * (H || 900),
    vx: (Math.random() - .5) * .42, vy: (Math.random() - .5) * .42,
    r: Math.random() * 2.4 + .6,
    col: P[Math.floor(Math.random() * P.length)],
    ph: Math.random() * Math.PI * 2, ps: Math.random() * .025 + .008
  }));

  /* Energy orbs */
  const orbs = [
    { x: .15, y: .25, r: 250, col: 'rgba(124,106,255,', a: .07,  dx: .00018, dy: .00013 },
    { x: .85, y: .75, r: 300, col: 'rgba(0,229,200,',   a: .055, dx: -.0003, dy: .0002 },
    { x: .5,  y: .88, r: 220, col: 'rgba(255,95,160,',  a: .05,  dx: .00014, dy: -.00022 },
    { x: .3,  y: .5,  r: 180, col: 'rgba(255,169,64,',  a: .04,  dx: -.0002, dy: .00012 },
    { x: .7,  y: .2,  r: 160, col: 'rgba(78,169,255,',  a: .04,  dx: .00022, dy: .00016 }
  ];

  /* Floating code symbols */
  const SYMS = ['</>', '{}', '[]', '==', '&&', '//', 'λ', '∞', '01', 'AI', 'ML', 'API', 'GIT', '>>','null','true','fn()','var','=>','async'];
  const floats = Array.from({ length: 22 }, () => ({
    x: Math.random() * (W || 1920), y: Math.random() * (H || 900),
    sym: SYMS[Math.floor(Math.random() * SYMS.length)],
    sz: Math.random() * 12 + 9,
    al: Math.random() * .16 + .04,
    vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .26,
    col: P[Math.floor(Math.random() * P.length)]
  }));

  /* Shooting stars */
  let shooters = [];
  function mkShooter() { return { x: Math.random() * W, y: Math.random() * H * .4, vx: Math.random() * 8 + 4, vy: Math.random() * 3 + 1, life: 1 }; }
  setInterval(() => { if (shooters.length < 5) shooters.push(mkShooter()); }, 2000);

  /* Hex grid */
  function hexGrid() {
    const hs = 72;
    for (let hx = -hs; hx < W + hs * 2; hx += hs * 1.732) {
      for (let hy = -hs; hy < H + hs * 2; hy += hs * 2) {
        const ox = (Math.round(hx / hs) % 2 === 0) ? 0 : hs * .866;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 3 * i - Math.PI / 6;
          i === 0 ? ctx.moveTo(hx + ox + Math.cos(a) * hs * .44, hy + Math.sin(a) * hs * .44)
                  : ctx.lineTo(hx + ox + Math.cos(a) * hs * .44, hy + Math.sin(a) * hs * .44);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(124,106,255,.016)'; ctx.lineWidth = .5; ctx.stroke();
      }
    }
  }

  /* ═══════════════════════════════════════════════════════
     CARTOON CHARACTER SYSTEM
  ═══════════════════════════════════════════════════════ */

  /* Each character is a self-contained object with pos, vel, state, draw() */
  const chars = [];

  /* Helper: lerp colour */
  function rgba(r, g, b, a) { return `rgba(${r},${g},${b},${a})`; }

  /* ─── 1. NINJA (mouse-reactive, bottom-left area) ─── */
  const ninja = {
    x: 120, y: 0, vx: 0, vy: 0,
    dir: 1, frame: 0, state: 'idle', actionTimer: 0,
    attackAnim: 0, trail: [],
    groundY: 0, initialized: false,
    col: { body:'#1a0a2e', band:'#7c6aff', eye:'#00e5c8', scarf:'#ff5fa0', sword:'#e0f0ff' },
    update(t) {
      if (!this.initialized) { this.x = W * .12; this.y = this.groundY = H - 90; this.initialized = true; }
      this.groundY = H - 90;
      this.frame++; this.actionTimer--;

      /* ── Decide action ── */
      if (this.actionTimer <= 0) {
        const ACTS = ['run','idle','jump','attack','crouch','spin','run','run'];
        this.state = ACTS[Math.floor(Math.random() * ACTS.length)];
        switch (this.state) {
          case 'run':    this.actionTimer = 80 + Math.random() * 120; break;
          case 'idle':   this.actionTimer = 40 + Math.random() * 50;  break;
          case 'jump':   this.actionTimer = 55; this.vy = -13;        break;
          case 'attack': this.actionTimer = 42; this.attackAnim = 0;  break;
          case 'crouch': this.actionTimer = 30 + Math.random() * 30;  break;
          case 'spin':   this.actionTimer = 60;                       break;
        }
      }

      /* ── Mouse pull ── */
      const mdx = mx - this.x, mdy = my - this.groundY;
      const md = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < 260 && md > 50) {
        this.dir = mdx > 0 ? 1 : -1;
        this.vx += (mdx / md) * .65;
        if (mdy < -70 && this.y >= this.groundY - 2 && Math.random() < .018) { this.vy = -12; this.state = 'jump'; }
        if (md < 70 && Math.random() < .012) { this.state = 'attack'; this.attackAnim = 0; this.actionTimer = 40; }
      }

      if (this.state === 'run' || this.state === 'spin') this.vx += this.dir * .5;
      this.vx *= .84; this.vy += .65;
      this.x += this.vx; this.y += this.vy;
      if (this.y >= this.groundY) { this.y = this.groundY; this.vy = 0; }
      if (this.x < 40)      { this.x = 40;      this.dir =  1; }
      if (this.x > W - 40)  { this.x = W - 40;  this.dir = -1; }
      if (Math.abs(this.vx) > .5) this.dir = this.vx > 0 ? 1 : -1;
      if (this.state === 'attack') this.attackAnim = Math.min(1, this.attackAnim + .08);

      if (Math.abs(this.vx) > 1.4 || this.state === 'spin')
        this.trail.push({ x: this.x, y: this.y, a: .45 });
      this.trail = this.trail.filter(p => { p.a -= .05; return p.a > 0; });
    },
    draw(t) {
      const { x, y, dir, state, frame, attackAnim } = this;
      const W2 = 21, H2 = 30;
      const crouch = state === 'crouch' ? 14 : 0;

      /* trail */
      this.trail.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.a * .2; ctx.fillStyle = '#7c6aff';
        ctx.beginPath(); ctx.ellipse(p.x, p.y + H2, W2 * .7, H2 * .8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });

      ctx.save();
      ctx.translate(x, y);
      if (state === 'spin') ctx.rotate(frame * .28 * dir);
      ctx.scale(dir, 1);

      /* shadow */
      ctx.save(); ctx.globalAlpha = .18; ctx.fillStyle = '#7c6aff';
      ctx.beginPath(); ctx.ellipse(0, H2 + 4, W2 * 1.1, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      /* body */
      ctx.beginPath(); ctx.roundRect(-W2 + 2, -H2 + 18 + crouch, (W2 - 2) * 2, state === 'crouch' ? 26 : 36, 8);
      ctx.fillStyle = this.col.body; ctx.fill();
      /* kimono V */
      ctx.beginPath(); ctx.moveTo(-7, -H2 + 20 + crouch); ctx.lineTo(0, -H2 + 28 + crouch); ctx.lineTo(7, -H2 + 20 + crouch);
      ctx.closePath(); ctx.fillStyle = this.col.band; ctx.fill();
      /* belt */
      ctx.beginPath(); ctx.roundRect(-W2 + 4, -H2 + 48 + crouch, (W2 - 4) * 2, 7, 3);
      ctx.fillStyle = this.col.band; ctx.fill();

      /* legs */
      const lb = state === 'run' ? Math.sin(frame * .35) * 8 : 0;
      const lb2 = -lb;
      const lh = state === 'crouch' ? 8 : 20;
      ctx.fillStyle = '#0e061e';
      ctx.beginPath(); ctx.roundRect(-W2 + 4, -H2 + 55 + crouch, 13, lh + lb, 4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(W2 - 17, -H2 + 55 + crouch, 13, lh + lb2, 4); ctx.fill();
      /* boots */
      ctx.fillStyle = this.col.band;
      ctx.beginPath(); ctx.roundRect(-W2 + 2, -H2 + 55 + crouch + lh + lb - 2, 17, 7, 3); ctx.fill();
      ctx.beginPath(); ctx.roundRect(W2 - 19, -H2 + 55 + crouch + lh + lb2 - 2, 17, 7, 3); ctx.fill();

      /* arms */
      const armSw = state === 'run' ? Math.sin(frame * .35) * 16 : 0;
      ctx.save(); ctx.translate(-W2 + 5, -H2 + 26 + crouch);
      ctx.rotate((armSw + (state === 'attack' ? -55 * attackAnim : 0)) * (Math.PI / 180));
      ctx.beginPath(); ctx.roundRect(-4, 0, 9, state === 'crouch' ? 14 : 22, 4);
      ctx.fillStyle = this.col.body; ctx.fill();
      ctx.beginPath(); ctx.arc(0, state === 'crouch' ? 18 : 26, 5, 0, Math.PI * 2); ctx.fillStyle = '#c47a6a'; ctx.fill();
      ctx.restore();
      ctx.save(); ctx.translate(W2 - 5, -H2 + 26 + crouch);
      ctx.rotate((-armSw + (state === 'attack' ? 88 * attackAnim : 0)) * (Math.PI / 180));
      ctx.beginPath(); ctx.roundRect(-5, 0, 9, state === 'crouch' ? 14 : 22, 4);
      ctx.fillStyle = this.col.body; ctx.fill();
      ctx.beginPath(); ctx.arc(0, state === 'crouch' ? 18 : 26, 5, 0, Math.PI * 2); ctx.fillStyle = '#c47a6a'; ctx.fill();
      ctx.restore();

      /* sword */
      if (state === 'attack') {
        ctx.save(); ctx.translate(W2 - 5, -H2 + 26 + crouch);
        ctx.rotate(88 * attackAnim * Math.PI / 180);
        ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 66);
        ctx.strokeStyle = this.col.sword; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.roundRect(-8, 30, 16, 5, 2); ctx.fillStyle = this.col.band; ctx.fill();
        ctx.save(); ctx.globalAlpha = .4; ctx.shadowBlur = 14; ctx.shadowColor = '#00e5c8';
        ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 66);
        ctx.strokeStyle = '#00e5c8'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        ctx.restore();
      }

      /* scarf */
      const sw = Math.sin(frame * .12) * 5;
      ctx.beginPath(); ctx.moveTo(-9, -H2 + 20 + crouch);
      ctx.bezierCurveTo(-20, -H2 + 26 + crouch + sw, -30, -H2 + 20 + crouch, -36 - (state === 'run' ? 9 : 0), -H2 + 16 + crouch + sw);
      ctx.strokeStyle = this.col.scarf; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();

      /* head */
      const hb = state === 'run' ? Math.sin(frame * .35) * 2 : 0;
      ctx.beginPath(); ctx.ellipse(0, -H2 + 11 + crouch + hb, 15, 16, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.col.body; ctx.fill();
      ctx.beginPath(); ctx.roundRect(-14, -H2 + 12 + crouch + hb, 28, 9, 5); ctx.fillStyle = '#2a1a4e'; ctx.fill();
      /* eyes glow */
      const eg = .6 + .4 * Math.sin(frame * .08);
      ctx.shadowBlur = 10; ctx.shadowColor = this.col.eye; ctx.fillStyle = this.col.eye; ctx.globalAlpha = eg;
      ctx.beginPath(); ctx.ellipse(-5, -H2 + 9 + crouch + hb, 3.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(5, -H2 + 9 + crouch + hb, 3.5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      /* headband */
      ctx.beginPath(); ctx.roundRect(-15, -H2 + 3 + crouch + hb, 30, 7, 4); ctx.fillStyle = this.col.band; ctx.fill();
      ctx.beginPath(); ctx.moveTo(13, -H2 + 6 + crouch + hb);
      ctx.bezierCurveTo(22, -H2 + 2 + crouch + hb + sw, 26, -H2 + crouch + hb, 20, -H2 - 4 + crouch + hb);
      ctx.strokeStyle = this.col.band; ctx.lineWidth = 3; ctx.stroke();

      /* jump sparkle */
      if (this.vy < -3) {
        ctx.save(); ctx.globalAlpha = .6;
        for (let i = 0; i < 5; i++) {
          const a = frame * .4 + i * 1.26, r = 22 + Math.sin(frame * .3) * 5;
          ctx.beginPath(); ctx.arc(Math.cos(a) * r, H2 + Math.sin(a) * r * .4 - 8, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 ? '#ffa940' : '#00e5c8'; ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();

      /* state label */
      if (state === 'attack' || state === 'spin') {
        ctx.save(); ctx.globalAlpha = .75;
        ctx.font = 'bold 10px IBM Plex Mono,monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = state === 'attack' ? '#00e5c8' : '#ffa940';
        ctx.fillText(state === 'attack' ? '⚡ STRIKE!' : '💫 SPIN!', x, y - 68);
        ctx.restore();
      }
    }
  };

  /* ─── Helper to draw a rounded rect with ctx ─── */
  if (!ctx.__rrDefined) {
    ctx.__rrDefined = true;
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y); this.arcTo(x + w, y, x + w, y + r, r);
        this.lineTo(x + w, y + h - r); this.arcTo(x + w, y + h, x + w - r, y + h, r);
        this.lineTo(x + r, y + h); this.arcTo(x, y + h, x, y + h - r, r);
        this.lineTo(x, y + r); this.arcTo(x, y, x + r, y, r);
        this.closePath();
      };
    }
  }

  /* ─── 2. HACKER GIRL – right side ─── */
  const hackerGirl = {
    x: 0, y: 0, bob: 0, frame: 0,
    update() {
      this.x = W - 130; this.y = H - 280;
      this.frame++; this.bob = Math.sin(this.frame * .04) * 8;
    },
    draw() {
      const { x } = this; const y = this.y + this.bob;
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = .82;

      /* legs */
      ctx.fillStyle = '#1a0a3e';
      ctx.beginPath(); ctx.roundRect(-18, 145, 16, 38, 5); ctx.fill();
      ctx.beginPath(); ctx.roundRect(2, 145, 16, 38, 5); ctx.fill();
      /* boots */
      ctx.fillStyle = '#7c6aff';
      ctx.beginPath(); ctx.roundRect(-20, 178, 20, 10, 4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(0, 178, 20, 10, 4); ctx.fill();

      /* hoodie body */
      ctx.fillStyle = '#2d1b6e';
      ctx.beginPath(); ctx.roundRect(-34, 85, 68, 70, 12); ctx.fill();
      /* hoodie pocket */
      ctx.fillStyle = '#1e1248';
      ctx.beginPath(); ctx.roundRect(-18, 120, 36, 26, 8); ctx.fill();
      /* laptop glow on pocket */
      ctx.fillStyle = 'rgba(0,229,200,.12)';
      ctx.beginPath(); ctx.roundRect(-14, 124, 28, 18, 5); ctx.fill();
      ctx.font = 'bold 9px IBM Plex Mono,monospace'; ctx.fillStyle = 'rgba(0,229,200,.7)';
      ctx.textAlign = 'center'; ctx.fillText('</>', 0, 137);

      /* arms */
      ctx.fillStyle = '#2d1b6e';
      ctx.beginPath(); ctx.roundRect(-52, 90, 20, 50, 8); ctx.fill(); /* left */
      ctx.beginPath(); ctx.roundRect(32, 90, 20, 50, 8); ctx.fill(); /* right */
      /* hands */
      ctx.fillStyle = '#f5c8a8';
      ctx.beginPath(); ctx.ellipse(-42, 143, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(42, 143, 11, 9, 0, 0, Math.PI * 2); ctx.fill();

      /* neck */
      ctx.fillStyle = '#f5c8a8';
      ctx.beginPath(); ctx.roundRect(-9, 68, 18, 22, 6); ctx.fill();

      /* head */
      ctx.fillStyle = '#f5c8a8';
      ctx.beginPath(); ctx.ellipse(0, 48, 30, 32, 0, 0, Math.PI * 2); ctx.fill();

      /* hair */
      ctx.fillStyle = '#7c6aff';
      ctx.beginPath(); ctx.ellipse(0, 32, 32, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 28, 26, 18, 0, 0, Math.PI * 2); ctx.fillStyle = '#5a3fd6'; ctx.fill();
      /* hair strands */
      ctx.strokeStyle = '#7c6aff'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-28, 40); ctx.bezierCurveTo(-42, 58, -40, 76, -34, 90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(28, 40); ctx.bezierCurveTo(42, 58, 40, 76, 34, 90); ctx.stroke();

      /* eyes */
      ctx.fillStyle = '#0d0820';
      ctx.beginPath(); ctx.ellipse(-11, 50, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(11, 50, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
      /* iris teal */
      ctx.fillStyle = '#00e5c8'; ctx.globalAlpha *= .7;
      ctx.beginPath(); ctx.ellipse(-11, 52, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(11, 52, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .82;
      /* shine */
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-8, 47, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(14, 47, 2.5, 0, Math.PI * 2); ctx.fill();
      /* eyebrows */
      ctx.strokeStyle = '#5a3fd6'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-18, 40); ctx.quadraticCurveTo(-11, 36, -4, 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, 40); ctx.quadraticCurveTo(11, 36, 18, 40); ctx.stroke();
      /* smile */
      ctx.strokeStyle = '#c47a6a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8, 64); ctx.quadraticCurveTo(0, 70, 8, 64); ctx.stroke();
      /* blush */
      ctx.fillStyle = 'rgba(255,150,150,.35)';
      ctx.beginPath(); ctx.ellipse(-18, 60, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18, 60, 8, 5, 0, 0, Math.PI * 2); ctx.fill();

      /* headphones */
      ctx.strokeStyle = '#00e5c8'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 40, 33, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#00e5c8';
      ctx.beginPath(); ctx.roundRect(-36, 34, 14, 18, 7); ctx.fill();
      ctx.beginPath(); ctx.roundRect(22, 34, 14, 18, 7); ctx.fill();

      /* laptop below */
      ctx.fillStyle = '#111425';
      ctx.beginPath(); ctx.roundRect(-42, 148, 84, 8, 3); ctx.fill();
      ctx.fillStyle = 'rgba(0,229,200,.15)';
      ctx.beginPath(); ctx.roundRect(-38, 150, 76, 4, 2); ctx.fill();

      /* floating code badge */
      const bw = Math.sin(this.frame * .06) * 3;
      ctx.save(); ctx.translate(50, 20 + bw);
      ctx.fillStyle = 'rgba(0,229,200,.14)';
      ctx.beginPath(); ctx.roundRect(-24, -12, 48, 24, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(0,229,200,.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(-24, -12, 48, 24, 6); ctx.stroke();
      ctx.font = 'bold 11px IBM Plex Mono,monospace'; ctx.fillStyle = 'rgba(0,229,200,.9)';
      ctx.textAlign = 'center'; ctx.fillText('{ code }', 0, 5);
      ctx.restore();

      ctx.restore();
    }
  };

  /* ─── 3. WIZARD/MAGE – left side ─── */
  const wizard = {
    x: 0, y: 0, bob: 0, frame: 0, sparkTimer: 0,
    sparks: [],
    update() {
      this.x = 80; this.y = H - 300;
      this.frame++; this.bob = Math.sin(this.frame * .035) * 10;
      this.sparkTimer++;
      if (this.sparkTimer % 18 === 0) {
        this.sparks.push({ x: this.x + 100, y: this.y + 30, vx: (Math.random()-0.5)*3, vy: -Math.random()*3-1, al: .9, col: Math.random()>.5?'#ffa940':'#00e5c8' });
      }
      this.sparks = this.sparks.filter(s => { s.x+=s.vx; s.y+=s.vy; s.vy+=.1; s.al-=.03; return s.al>0; });
    },
    draw() {
      const { x } = this; const y = this.y + this.bob;
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = .8;

      /* robe */
      ctx.fillStyle = '#0d4a4a';
      ctx.beginPath(); ctx.moveTo(-30, 80); ctx.lineTo(-40, 200); ctx.lineTo(40, 200); ctx.lineTo(30, 80); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0a3a3a';
      ctx.beginPath(); ctx.moveTo(-8, 80); ctx.lineTo(-10, 200); ctx.lineTo(10, 200); ctx.lineTo(8, 80); ctx.closePath(); ctx.fill();

      /* staff */
      ctx.strokeStyle = '#c8a030'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(88, 20); ctx.lineTo(88, 180); ctx.stroke();
      /* orb on staff */
      ctx.save();
      ctx.shadowBlur = 20; ctx.shadowColor = '#ffa940';
      ctx.fillStyle = '#ffa940'; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.arc(88, 18, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,220,.6)';
      ctx.beginPath(); ctx.arc(84, 14, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      /* staff sparks */
      this.sparks.forEach(s => {
        ctx.save(); ctx.globalAlpha = s.al; ctx.fillStyle = s.col;
        ctx.beginPath(); ctx.arc(s.x - x, s.y - y - this.bob, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });

      /* arms / sleeves */
      ctx.fillStyle = '#0d4a4a';
      ctx.beginPath(); ctx.moveTo(-30, 90); ctx.bezierCurveTo(-60, 110, -68, 140, -62, 160); ctx.lineTo(-48, 155); ctx.bezierCurveTo(-52, 138, -44, 112, -16, 95); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(30, 90); ctx.bezierCurveTo(60, 110, 68, 140, 62, 160); ctx.lineTo(48, 155); ctx.bezierCurveTo(52, 138, 44, 112, 16, 95); ctx.closePath(); ctx.fill();
      /* hands */
      ctx.fillStyle = '#e8c8a0';
      ctx.beginPath(); ctx.ellipse(-56, 158, 11, 9, -.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(56, 158, 11, 9, .3, 0, Math.PI * 2); ctx.fill();

      /* neck */
      ctx.fillStyle = '#e8c8a0';
      ctx.beginPath(); ctx.roundRect(-8, 62, 16, 22, 6); ctx.fill();

      /* head */
      ctx.fillStyle = '#e8c8a0';
      ctx.beginPath(); ctx.ellipse(0, 44, 28, 30, 0, 0, Math.PI * 2); ctx.fill();

      /* wizard hat */
      ctx.fillStyle = '#00a8a0';
      ctx.beginPath(); ctx.moveTo(-32, 28); ctx.lineTo(0, -58); ctx.lineTo(32, 28); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#007a74';
      ctx.beginPath(); ctx.ellipse(0, 28, 36, 11, 0, 0, Math.PI * 2); ctx.fill();
      /* hat star */
      ctx.save(); ctx.shadowBlur = 12; ctx.shadowColor = '#ffa940';
      ctx.fillStyle = '#ffa940';
      ctx.beginPath(); ctx.arc(0, -28, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      /* hair under hat */
      ctx.strokeStyle = '#00e5c8'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-26, 32); ctx.bezierCurveTo(-40, 50, -38, 68, -30, 82); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, 32); ctx.bezierCurveTo(40, 50, 38, 68, 30, 82); ctx.stroke();

      /* eyes */
      ctx.fillStyle = '#0a1a1e';
      ctx.beginPath(); ctx.ellipse(-10, 46, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, 46, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7c6aff'; ctx.globalAlpha = .75;
      ctx.beginPath(); ctx.ellipse(-10, 48, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, 48, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .8;
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-7, 43, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(13, 43, 2.5, 0, Math.PI * 2); ctx.fill();
      /* smile smirk */
      ctx.strokeStyle = '#c47a6a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-5, 60); ctx.quadraticCurveTo(6, 66, 12, 60); ctx.stroke();

      ctx.restore();
    }
  };

  /* ─── 4. CHIBI ROBOT – top right ─── */
  const robot = {
    x: 0, y: 0, bob: 0, frame: 0, blinkTimer: 0, eyeOpen: true,
    update() {
      this.x = W - 110; this.y = 140;
      this.frame++; this.bob = Math.sin(this.frame * .05) * 7;
      this.blinkTimer++;
      if (this.blinkTimer > 80 && this.blinkTimer < 86) this.eyeOpen = false; else this.eyeOpen = true;
      if (this.blinkTimer > 90) this.blinkTimer = 0;
    },
    draw() {
      const y = this.y + this.bob;
      ctx.save(); ctx.translate(this.x, y); ctx.globalAlpha = .78;

      /* antenna */
      ctx.strokeStyle = '#ff5fa0'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, -30); ctx.stroke();
      ctx.save(); ctx.shadowBlur = 14; ctx.shadowColor = '#ff5fa0';
      ctx.fillStyle = '#ff5fa0'; ctx.beginPath(); ctx.arc(0, -34, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      /* head */
      ctx.fillStyle = '#1a1040';
      ctx.beginPath(); ctx.roundRect(-32, -8, 64, 52, 12); ctx.fill();
      ctx.strokeStyle = '#ff5fa0'; ctx.lineWidth = 1.5; ctx.globalAlpha = .4;
      ctx.beginPath(); ctx.roundRect(-32, -8, 64, 52, 12); ctx.stroke(); ctx.globalAlpha = .78;

      /* eye screens */
      const eyeH = this.eyeOpen ? 14 : 3;
      ctx.fillStyle = 'rgba(255,95,160,.15)';
      ctx.beginPath(); ctx.roundRect(-26, 6, 20, eyeH, 5); ctx.fill();
      ctx.beginPath(); ctx.roundRect(6, 6, 20, eyeH, 5); ctx.fill();
      if (this.eyeOpen) {
        ctx.fillStyle = '#ff5fa0';
        ctx.beginPath(); ctx.roundRect(-22, 11, 12, 3, 1); ctx.fill();
        ctx.beginPath(); ctx.roundRect(10, 11, 12, 3, 1); ctx.fill();
      }

      /* mouth LED */
      ctx.fillStyle = '#0d0820';
      ctx.beginPath(); ctx.roundRect(-22, 28, 44, 8, 4); ctx.fill();
      const ledCols = ['#ff5fa0', '#7c6aff', '#00e5c8', '#ffa940'];
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = ledCols[i];
        ctx.beginPath(); ctx.roundRect(-18 + i * 10, 30, 7, 4, 2); ctx.fill();
      }

      /* body */
      ctx.fillStyle = '#1a1040';
      ctx.beginPath(); ctx.roundRect(-28, 46, 56, 55, 12); ctx.fill();
      ctx.strokeStyle = '#7c6aff'; ctx.lineWidth = 1; ctx.globalAlpha = .35;
      ctx.beginPath(); ctx.roundRect(-28, 46, 56, 55, 12); ctx.stroke(); ctx.globalAlpha = .78;
      /* chest panel */
      ctx.fillStyle = '#0d0820';
      ctx.beginPath(); ctx.roundRect(-20, 54, 40, 32, 7); ctx.fill();
      /* chest lights */
      const pulse = .5 + .5 * Math.sin(this.frame * .12);
      ctx.shadowBlur = 8 + pulse * 6;
      ctx.fillStyle = '#ff5fa0'; ctx.shadowColor = '#ff5fa0';
      ctx.beginPath(); ctx.arc(-10, 66, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7c6aff'; ctx.shadowColor = '#7c6aff';
      ctx.beginPath(); ctx.arc(0, 66, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#00e5c8'; ctx.shadowColor = '#00e5c8';
      ctx.beginPath(); ctx.arc(10, 66, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      /* power bar */
      ctx.fillStyle = '#1e1040';
      ctx.beginPath(); ctx.roundRect(-16, 76, 32, 4, 2); ctx.fill();
      ctx.fillStyle = '#00e5c8';
      ctx.beginPath(); ctx.roundRect(-16, 76, 20 + pulse * 6, 4, 2); ctx.fill();

      /* arms */
      const armBob = Math.sin(this.frame * .04) * 5;
      ctx.fillStyle = '#1a1040';
      ctx.beginPath(); ctx.roundRect(-42, 50 + armBob, 16, 38, 7); ctx.fill();
      ctx.beginPath(); ctx.roundRect(26, 50 - armBob, 16, 38, 7); ctx.fill();
      ctx.fillStyle = '#261650';
      ctx.beginPath(); ctx.roundRect(-44, 86 + armBob, 20, 12, 6); ctx.fill();
      ctx.beginPath(); ctx.roundRect(24, 86 - armBob, 20, 12, 6); ctx.fill();

      /* legs */
      ctx.fillStyle = '#120830';
      ctx.beginPath(); ctx.roundRect(-20, 99, 16, 20, 5); ctx.fill();
      ctx.beginPath(); ctx.roundRect(4, 99, 16, 20, 5); ctx.fill();

      ctx.restore();
    }
  };

  /* ─── 5. CAT CODER – top left ─── */
  const cat = {
    x: 0, y: 0, bob: 0, frame: 0, tailWag: 0,
    update() {
      this.x = 60; this.y = 150;
      this.frame++; this.bob = Math.sin(this.frame * .045) * 7;
      this.tailWag = Math.sin(this.frame * .08) * 25;
    },
    draw() {
      const y = this.y + this.bob;
      ctx.save(); ctx.translate(this.x, y); ctx.globalAlpha = .78;

      /* tail */
      ctx.save(); ctx.translate(32, 130);
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(40, -20 + this.tailWag * .5, 55, 10 + this.tailWag, 40, 35 + this.tailWag * .7);
      ctx.strokeStyle = '#ffa940'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.stroke();
      ctx.fillStyle = '#ffa940';
      ctx.beginPath(); ctx.arc(40, 35 + this.tailWag * .7, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      /* body */
      ctx.fillStyle = '#ffa940';
      ctx.beginPath(); ctx.roundRect(-28, 80, 56, 60, 12); ctx.fill();
      /* hoodie */
      ctx.fillStyle = '#c47a00';
      ctx.beginPath(); ctx.roundRect(-14, 100, 28, 28, 8); ctx.fill();
      ctx.font = 'bold 12px IBM Plex Mono,monospace'; ctx.fillStyle = '#fff8e8';
      ctx.textAlign = 'center'; ctx.fillText('</>', 0, 118);

      /* arms */
      ctx.fillStyle = '#ffa940';
      ctx.beginPath(); ctx.roundRect(-44, 86, 18, 38, 9); ctx.fill();
      ctx.beginPath(); ctx.roundRect(26, 86, 18, 38, 9); ctx.fill();
      /* paws */
      ctx.fillStyle = '#fff8e8';
      ctx.beginPath(); ctx.ellipse(-35, 126, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(35, 126, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
      /* toe beans */
      ctx.fillStyle = '#ffc0b0';
      [-44, -35, -26].forEach(bx => { ctx.beginPath(); ctx.arc(bx + 9, 128, 2.5, 0, Math.PI * 2); ctx.fill(); });
      [26, 35, 44].forEach(bx => { ctx.beginPath(); ctx.arc(bx - 9, 128, 2.5, 0, Math.PI * 2); ctx.fill(); });

      /* legs */
      ctx.fillStyle = '#c47a00';
      ctx.beginPath(); ctx.roundRect(-24, 136, 18, 22, 7); ctx.fill();
      ctx.beginPath(); ctx.roundRect(6, 136, 18, 22, 7); ctx.fill();

      /* ears */
      ctx.fillStyle = '#ffa940';
      ctx.beginPath(); ctx.moveTo(-26, 22); ctx.lineTo(-10, -8); ctx.lineTo(2, 22); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, 22); ctx.lineTo(12, -8); ctx.lineTo(28, 22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffcf80';
      ctx.beginPath(); ctx.moveTo(-22, 22); ctx.lineTo(-10, 0); ctx.lineTo(0, 22); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(12, 0); ctx.lineTo(24, 22); ctx.closePath(); ctx.fill();

      /* head */
      ctx.fillStyle = '#fff8e8';
      ctx.beginPath(); ctx.ellipse(0, 48, 34, 32, 0, 0, Math.PI * 2); ctx.fill();
      /* face fur patches */
      ctx.fillStyle = '#ffa940'; ctx.globalAlpha = .2;
      ctx.beginPath(); ctx.ellipse(-14, 44, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(14, 44, 10, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .78;

      /* eyes */
      ctx.fillStyle = '#1a0a00';
      ctx.beginPath(); ctx.ellipse(-12, 48, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(12, 48, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
      /* iris amber */
      ctx.fillStyle = '#ffa940';
      ctx.beginPath(); ctx.ellipse(-12, 50, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(12, 50, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
      /* slit pupil */
      ctx.fillStyle = '#1a0a00';
      ctx.beginPath(); ctx.ellipse(-12, 50, 2, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(12, 50, 2, 7, 0, 0, Math.PI * 2); ctx.fill();
      /* eye shine */
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(-9, 45, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(15, 45, 3, 0, Math.PI * 2); ctx.fill();

      /* eyebrows */
      ctx.strokeStyle = '#c47a00'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-20, 36); ctx.quadraticCurveTo(-12, 32, -4, 36); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4, 36); ctx.quadraticCurveTo(12, 32, 20, 36); ctx.stroke();

      /* nose */
      ctx.fillStyle = '#ffaaaa';
      ctx.beginPath(); ctx.moveTo(-5, 60); ctx.lineTo(0, 65); ctx.lineTo(5, 60); ctx.closePath(); ctx.fill();
      /* mouth */
      ctx.strokeStyle = '#c47a6a'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(-7, 65); ctx.quadraticCurveTo(0, 72, 7, 65); ctx.stroke();
      /* whiskers */
      ctx.strokeStyle = 'rgba(196,122,0,.5)'; ctx.lineWidth = 1.2;
      [[-32,57,-10,60],[-32,63,-10,63],[10,60,32,57],[10,63,32,63]].forEach(w => {
        ctx.beginPath(); ctx.moveTo(w[0],w[1]); ctx.lineTo(w[2],w[3]); ctx.stroke();
      });

      ctx.restore();
    }
  };

  /* ─── 6. ASTRONAUT – floats slowly down from top ─── */
  const astro = {
    x: 0, y: -180, vy: .18, frame: 0,
    update() {
      this.x = W * .82;
      this.frame++;
      this.y += this.vy + Math.sin(this.frame * .022) * .4;
      if (this.y > H + 200) this.y = -200;
    },
    draw() {
      const { x, y, frame } = this;
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = .72;

      /* rope tether from top */
      ctx.save(); ctx.globalAlpha = .25; ctx.strokeStyle = '#7c6aff'; ctx.lineWidth = 2; ctx.setLineDash([6,6]);
      ctx.beginPath(); ctx.moveTo(0, -y); ctx.lineTo(0, 0); ctx.stroke(); ctx.setLineDash([]); ctx.restore();

      /* legs */
      ctx.fillStyle = '#e0f0ff';
      ctx.beginPath(); ctx.roundRect(-18, 90, 15, 32, 6); ctx.fill();
      ctx.beginPath(); ctx.roundRect(3, 90, 15, 32, 6); ctx.fill();
      /* boots */
      ctx.fillStyle = '#7c6aff';
      ctx.beginPath(); ctx.roundRect(-20, 118, 19, 10, 4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(1, 118, 19, 10, 4); ctx.fill();

      /* suit body */
      ctx.fillStyle = '#e0f0ff';
      ctx.beginPath(); ctx.roundRect(-28, 44, 56, 54, 14); ctx.fill();
      /* chest pack */
      ctx.fillStyle = '#c0d8f0';
      ctx.beginPath(); ctx.roundRect(-16, 56, 32, 28, 7); ctx.fill();
      /* pack lights */
      const bp = .5 + .5 * Math.sin(frame * .1);
      ctx.fillStyle = `rgba(0,229,200,${bp})`; ctx.beginPath(); ctx.arc(-6, 66, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,95,160,${bp})`; ctx.beginPath(); ctx.arc(6, 66, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,169,64,${bp})`; ctx.beginPath(); ctx.arc(0, 76, 4, 0, Math.PI * 2); ctx.fill();

      /* arms */
      ctx.fillStyle = '#e0f0ff';
      const aw = Math.sin(frame * .05) * 8;
      ctx.beginPath(); ctx.roundRect(-48, 50 + aw, 22, 42, 10); ctx.fill();
      ctx.beginPath(); ctx.roundRect(26, 50 - aw, 22, 42, 10); ctx.fill();
      /* gloves */
      ctx.fillStyle = '#7c6aff';
      ctx.beginPath(); ctx.ellipse(-37, 93 + aw, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(37, 93 - aw, 12, 10, 0, 0, Math.PI * 2); ctx.fill();

      /* helmet */
      ctx.fillStyle = '#e0f0ff';
      ctx.beginPath(); ctx.arc(0, 22, 32, 0, Math.PI * 2); ctx.fill();
      /* visor */
      ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = '#00e5c8';
      ctx.fillStyle = 'rgba(0,229,200,.3)';
      ctx.beginPath(); ctx.arc(0, 22, 22, 0, Math.PI * 2); ctx.fill();
      /* face inside visor */
      ctx.fillStyle = '#f5c8a8'; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.ellipse(0, 24, 14, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      /* visor shine */
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.arc(-8, 12, 10, 0, Math.PI * 2); ctx.fill();
      /* eyes */
      ctx.fillStyle = '#0d0820';
      ctx.beginPath(); ctx.ellipse(-5, 22, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(5, 22, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(-3, 20, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7, 20, 1.5, 0, Math.PI * 2); ctx.fill();
      /* smile */
      ctx.strokeStyle = '#c47a6a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-6, 32); ctx.quadraticCurveTo(0, 37, 6, 32); ctx.stroke();
      /* helmet ring */
      ctx.strokeStyle = '#c0d8f0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 22, 32, 0, Math.PI * 2); ctx.stroke();

      ctx.restore();
    }
  };

  /* ─── 7. PIXEL DRAGON – flies across screen ─── */
  const dragon = {
    x: -200, y: H * .14, vx: 1.4, frame: 0, dir: 1,
    update() {
      this.frame++;
      this.x += this.vx;
      this.y += Math.sin(this.frame * .04) * 1.2;
      if (this.x > W + 250) { this.x = -250; this.dir = 1; }
      if (this.x < -250)    { this.x = W + 250; this.dir = -1; }
    },
    draw() {
      const { x, y, dir, frame } = this;
      ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.globalAlpha = .65;

      /* wing flap */
      const wf = Math.sin(frame * .22) * 18;
      /* back wing */
      ctx.fillStyle = 'rgba(124,106,255,.5)';
      ctx.beginPath(); ctx.moveTo(-20, -10); ctx.bezierCurveTo(-60, -40 - wf, -90, -30 - wf, -70, 10); ctx.bezierCurveTo(-60, 25, -30, 20, -20, 0); ctx.closePath(); ctx.fill();
      /* front wing */
      ctx.fillStyle = 'rgba(124,106,255,.75)';
      ctx.beginPath(); ctx.moveTo(20, -10); ctx.bezierCurveTo(60, -50 - wf, 95, -40 - wf, 80, 8); ctx.bezierCurveTo(70, 24, 35, 22, 20, 0); ctx.closePath(); ctx.fill();
      /* wing membranes */
      ctx.strokeStyle = 'rgba(0,229,200,.4)'; ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(20, -10); ctx.lineTo(60 + i * 10, -30 - wf + i * 5); ctx.stroke();
      }

      /* body */
      ctx.fillStyle = '#3d2b8e';
      ctx.beginPath(); ctx.ellipse(0, 0, 36, 18, 0, 0, Math.PI * 2); ctx.fill();
      /* scales */
      ctx.fillStyle = '#4a35aa';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.arc(i * 12, -6, 7, Math.PI, 0); ctx.fill();
      }

      /* tail */
      ctx.strokeStyle = '#3d2b8e'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-30, 4); ctx.bezierCurveTo(-60, 20, -80, 10, -90, 30); ctx.stroke();
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-90, 30); ctx.bezierCurveTo(-100, 45, -95, 55, -85, 50); ctx.stroke();

      /* head */
      ctx.fillStyle = '#3d2b8e';
      ctx.beginPath(); ctx.ellipse(44, -4, 22, 15, .3, 0, Math.PI * 2); ctx.fill();
      /* snout */
      ctx.beginPath(); ctx.ellipse(60, -2, 10, 8, .2, 0, Math.PI * 2); ctx.fill();
      /* eye */
      ctx.save(); ctx.shadowBlur = 12; ctx.shadowColor = '#00e5c8';
      ctx.fillStyle = '#00e5c8';
      ctx.beginPath(); ctx.ellipse(52, -10, 5, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#0d0820';
      ctx.beginPath(); ctx.ellipse(53, -10, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
      /* nostril fire breath */
      if (frame % 90 < 30) {
        const fp = (frame % 90) / 30;
        ctx.save(); ctx.globalAlpha = .7 * (1 - fp);
        ctx.fillStyle = '#ffa940';
        ctx.beginPath(); ctx.moveTo(68, -2); ctx.lineTo(80 + fp * 30, -8 - fp * 10); ctx.lineTo(78 + fp * 25, 4 + fp * 5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff5fa0'; ctx.globalAlpha *= .5;
        ctx.beginPath(); ctx.arc(74 + fp * 15, -2, 6 + fp * 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      /* horn */
      ctx.fillStyle = '#ffa940';
      ctx.beginPath(); ctx.moveTo(48, -18); ctx.lineTo(52, -34); ctx.lineTo(58, -18); ctx.closePath(); ctx.fill();

      ctx.restore();
    }
  };

  /* ─── 8. CHIBI DEVELOPER (coffee + laptop) – bottom mid ─── */
  const dev = {
    x: 0, y: 0, bob: 0, frame: 0, typeTimer: 0, typed: 0,
    update() {
      this.x = W * .5; this.y = H - 180;
      this.frame++; this.bob = Math.sin(this.frame * .038) * 5;
      this.typeTimer++;
    },
    draw() {
      const { x } = this; const y = this.y + this.bob;
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = .75;

      /* laptop */
      ctx.fillStyle = '#1a1040';
      ctx.beginPath(); ctx.roundRect(-52, -38, 104, 8, 3); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-48, -76, 96, 40, 6); ctx.fill();
      /* screen */
      ctx.fillStyle = '#0d0820';
      ctx.beginPath(); ctx.roundRect(-44, -72, 88, 32, 4); ctx.fill();
      /* screen glow */
      ctx.fillStyle = 'rgba(124,106,255,.08)';
      ctx.beginPath(); ctx.roundRect(-44, -72, 88, 32, 4); ctx.fill();
      /* typing text lines on screen */
      const lineAlpha = [.7, .5, .4, .25];
      const lineWidths = [50, 38, 60, 28];
      const colors = ['#00e5c8', '#7c6aff', '#ff5fa0', '#ffa940'];
      lineAlpha.forEach((a, i) => {
        ctx.fillStyle = colors[i]; ctx.globalAlpha = a * .8;
        ctx.beginPath(); ctx.roundRect(-38, -68 + i * 8, lineWidths[i], 3, 1); ctx.fill();
      });
      ctx.globalAlpha = .75;
      /* cursor blink */
      if (this.frame % 60 < 30) {
        ctx.fillStyle = '#00e5c8';
        ctx.beginPath(); ctx.roundRect(-38 + (this.frame % 30) * 1.5, -68, 2, 6, 1); ctx.fill();
      }

      /* body */
      ctx.fillStyle = '#2d1b6e';
      ctx.beginPath(); ctx.roundRect(-22, -36, 44, 50, 10); ctx.fill();
      /* shirt design */
      ctx.font = 'bold 8px IBM Plex Mono,monospace'; ctx.fillStyle = 'rgba(0,229,200,.8)';
      ctx.textAlign = 'center'; ctx.fillText('{ dev }', 0, -14);

      /* arms reaching to laptop */
      ctx.fillStyle = '#2d1b6e';
      ctx.beginPath(); ctx.roundRect(-44, -42, 24, 28, 8); ctx.fill();
      ctx.beginPath(); ctx.roundRect(20, -42, 24, 28, 8); ctx.fill();
      ctx.fillStyle = '#f5c8a8';
      ctx.beginPath(); ctx.roundRect(-46, -18, 14, 10, 5); ctx.fill();
      ctx.beginPath(); ctx.roundRect(32, -18, 14, 10, 5); ctx.fill();

      /* legs */
      ctx.fillStyle = '#1a0a3e';
      ctx.beginPath(); ctx.roundRect(-18, 12, 14, 26, 5); ctx.fill();
      ctx.beginPath(); ctx.roundRect(4, 12, 14, 26, 5); ctx.fill();

      /* head */
      ctx.fillStyle = '#f5c8a8';
      ctx.beginPath(); ctx.ellipse(0, -54, 22, 24, 0, 0, Math.PI * 2); ctx.fill();
      /* hair spiky */
      ctx.fillStyle = '#ff5fa0';
      ctx.beginPath(); ctx.moveTo(-22, -60); ctx.bezierCurveTo(-26, -80, -14, -84, -8, -72); ctx.bezierCurveTo(-6, -88, 6, -90, 8, -76); ctx.bezierCurveTo(12, -86, 22, -84, 24, -68); ctx.lineTo(22, -58); ctx.lineTo(-22, -58); ctx.closePath(); ctx.fill();
      /* glasses */
      ctx.strokeStyle = '#7c6aff'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(-20, -60, 15, 10, 4); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(5, -60, 15, 10, 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-5, -55); ctx.lineTo(5, -55); ctx.stroke();
      /* eyes behind glasses */
      ctx.fillStyle = '#0d0820';
      ctx.beginPath(); ctx.ellipse(-12, -54, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(12, -54, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(-10, -56, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(14, -56, 1.5, 0, Math.PI * 2); ctx.fill();
      /* mouth focus line */
      ctx.strokeStyle = '#c47a6a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, -42); ctx.lineTo(5, -42); ctx.stroke();

      /* coffee cup */
      ctx.save(); ctx.translate(46, -28);
      ctx.fillStyle = '#7c4000';
      ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-10, 12); ctx.lineTo(10, 12); ctx.lineTo(8, -12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c47a00';
      ctx.beginPath(); ctx.roundRect(-9, -14, 18, 4, 2); ctx.fill();
      ctx.strokeStyle = '#7c4000'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(12, 0, 6, -Math.PI * .5, Math.PI * .5); ctx.stroke();
      /* steam */
      const st = Math.sin(this.frame * .1);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-3, -14); ctx.bezierCurveTo(-6, -22 + st * 2, 0, -26 + st, 2, -34); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3, -14); ctx.bezierCurveTo(6, -22 + st * 2, 0, -26 + st, -2, -34); ctx.stroke();
      ctx.restore();

      ctx.restore();
    }
  };

  /* ─── Collect all chars (ninja handled separately for mouse interaction) ─── */
  const bgChars = [hackerGirl, wizard, robot, cat, astro, dragon];

  /* ═══════════════════════════════════════════════════════
     MAIN DRAW LOOP
  ═══════════════════════════════════════════════════════ */
  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += .012;

    /* Orbs */
    orbs.forEach(o => {
      o.x += o.dx; o.y += o.dy;
      if (o.x < 0 || o.x > 1) o.dx *= -1;
      if (o.y < 0 || o.y > 1) o.dy *= -1;
      const g = ctx.createRadialGradient(o.x * W, o.y * H, 0, o.x * W, o.y * H, o.r);
      g.addColorStop(0, o.col + o.a + ')'); g.addColorStop(1, o.col + '0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });

    /* Hex grid */
    hexGrid();

    /* Stars */
    STARS.forEach(s => {
      s.ph += s.sp;
      const a = s.a * (.5 + .5 * Math.sin(s.ph));
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,238,253,${a})`; ctx.fill();
    });

    /* Shooting stars */
    shooters = shooters.filter(s => {
      s.x += s.vx; s.y += s.vy; s.life -= .014;
      if (s.life <= 0 || s.x > W + 100) return false;
      const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 9, s.y - s.vy * 9);
      g.addColorStop(0, `rgba(255,255,255,${s.life})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 9, s.y - s.vy * 9);
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke();
      return true;
    });

    /* Node connections */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 128) {
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(124,106,255,${(1 - d / 128) * .1})`; ctx.lineWidth = .65; ctx.stroke();
        }
      }
    }

    /* Nodes */
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy; n.ph += n.ps;
      if (n.x < 0) { n.x = 0; n.vx *= -1; } if (n.x > W) { n.x = W; n.vx *= -1; }
      if (n.y < 0) { n.y = 0; n.vy *= -1; } if (n.y > H) { n.y = H; n.vy *= -1; }
      const a = .22 + .18 * Math.sin(n.ph);
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.col + a + ')'; ctx.fill();
    });

    /* Floating code symbols */
    ctx.save();
    floats.forEach(f => {
      f.x += f.vx; f.y += f.vy;
      if (f.x < -60) f.x = W + 60; if (f.x > W + 60) f.x = -60;
      if (f.y < -60) f.y = H + 60; if (f.y > H + 60) f.y = -60;
      ctx.font = `${f.sz}px "IBM Plex Mono",monospace`;
      ctx.fillStyle = f.col + f.al + ')';
      ctx.fillText(f.sym, f.x, f.y);
    });
    ctx.restore();

    /* Sakura petals */
    petals.forEach((p, i) => {
      p.x += p.vx + Math.sin(t * .8 + i) * .35;
      p.y += p.vy; p.rot += p.rs;
      if (p.y > H + 30) { petals[i] = mkPetal(); return; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.moveTo(0, -p.sz * .5);
      ctx.bezierCurveTo(p.sz * .6, -p.sz * .5, p.sz * .6, p.sz * .5, 0, p.sz * .6);
      ctx.bezierCurveTo(-p.sz * .6, p.sz * .5, -p.sz * .6, -p.sz * .5, 0, -p.sz * .5);
      ctx.fillStyle = p.col + p.al + ')'; ctx.fill(); ctx.restore();
    });

    /* Update + draw background characters */
    bgChars.forEach(c => { c.update(); c.draw(); });

    /* Ninja (mouse-reactive) */
    ninja.update(t); ninja.draw(t);

    requestAnimationFrame(draw);
  }
  draw();

  /* ═══════════════════════════════════════════════════════
     WELCOME CHIP  (index page only — participant login)
  ═══════════════════════════════════════════════════════ */
  window.addEventListener('DOMContentLoaded', () => {
    const HF = { get: k => { try { return JSON.parse(localStorage.getItem('hf_' + k)); } catch { return null; } } };
    const user = HF.get('currentUser');
    if (!user || user.role === 'admin') return;

    const chip = document.createElement('div');
    chip.id = 'welcomeChip';
    chip.innerHTML = `
      <div class="wc-avatar">${(user.name || 'H')[0].toUpperCase()}</div>
      <div class="wc-text">
        <span class="wc-greeting">Welcome back 👋</span>
        <span class="wc-name">${user.name || 'Hacker'}</span>
      </div>
      <button class="wc-logout" title="Logout" onclick="localStorage.removeItem('hf_currentUser');location.reload();">✕</button>
    `;
    document.body.appendChild(chip);
    requestAnimationFrame(() => requestAnimationFrame(() => chip.classList.add('wc-visible')));
    let ht = setTimeout(() => chip.classList.add('wc-hiding'), 7000);
    chip.addEventListener('mouseenter', () => { clearTimeout(ht); chip.classList.remove('wc-hiding'); });
    chip.addEventListener('mouseleave', () => { ht = setTimeout(() => chip.classList.add('wc-hiding'), 3000); });
  });

})();
