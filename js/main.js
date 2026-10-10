/* ==================== HACKFUSION - MAIN JS ==================== */

// ── GSAP Registration ──
gsap.registerPlugin(ScrollTrigger);

// ==================== LOADER ====================
const loader = document.getElementById('loader');
const loaderFill = document.querySelector('.loader-fill');
const loaderPercent = document.getElementById('loaderPercent');

let progress = 0;
const loadInterval = setInterval(() => {
  progress += Math.random() * 12;
  if (progress >= 100) {
    progress = 100;
    clearInterval(loadInterval);
    setTimeout(() => {
      loader.classList.add('hidden');
      initAnimations();
    }, 400);
  }
  loaderFill.style.width = progress + '%';
  loaderPercent.textContent = Math.floor(progress) + '%';
}, 80);

// ==================== CUSTOM CURSOR ====================
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursorFollower');
let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
});

// Smooth follower
function animateFollower() {
  followerX += (mouseX - followerX) * 0.12;
  followerY += (mouseY - followerY) * 0.12;
  cursorFollower.style.left = followerX + 'px';
  cursorFollower.style.top = followerY + 'px';
  requestAnimationFrame(animateFollower);
}
animateFollower();

// Cursor hover effects
document.querySelectorAll('a, button, .track-card, .faq-question, .btn').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.classList.add('hovered');
    cursorFollower.classList.add('hovered');
  });
  el.addEventListener('mouseleave', () => {
    cursor.classList.remove('hovered');
    cursorFollower.classList.remove('hovered');
  });
});

// ==================== HERO CANVAS (Particle Field) ====================
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const particles = [];
const PARTICLE_COUNT = 120;

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = (Math.random() - 0.5) * 0.6;
    this.radius = Math.random() * 2 + 0.5;
    this.alpha = Math.random() * 0.6 + 0.1;
    this.color = Math.random() > 0.5 ? '108,99,255' : '0,245,212';
    this.pulse = Math.random() * Math.PI * 2;
    this.pulseSpeed = Math.random() * 0.02 + 0.01;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.pulse += this.pulseSpeed;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
    // Mouse repulsion
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 120) {
      const force = (120 - dist) / 120;
      this.vx -= (dx / dist) * force * 0.5;
      this.vy -= (dy / dist) * force * 0.5;
    }
    // Speed limit
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 2) {
      this.vx = (this.vx / speed) * 2;
      this.vy = (this.vy / speed) * 2;
    }
  }
  draw() {
    const dynamicAlpha = this.alpha * (0.7 + 0.3 * Math.sin(this.pulse));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color},${dynamicAlpha})`;
    ctx.fill();
  }
}

for (let i = 0; i < PARTICLE_COUNT; i++) {
  particles.push(new Particle());
}

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        const alpha = (1 - dist / 130) * 0.25;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(108,99,255,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

function animateCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Background gradient
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  gradient.addColorStop(0, 'rgba(15,15,45,0.3)');
  gradient.addColorStop(1, 'rgba(5,5,16,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawConnections();
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateCanvas);
}
animateCanvas();

// ==================== TYPEWRITER ====================
const phrases = [
  'Build the future in 24 hours.',
  'Code. Create. Compete.',
  'Where ideas become reality.',
  'Hack. Innovate. Win.',
  '2500+ hackers. One stage.'
];
let phraseIndex = 0, charIndex = 0, isDeleting = false;
const typewriterEl = document.getElementById('typewriter');

function typeWriter() {
  const current = phrases[phraseIndex];
  if (isDeleting) {
    typewriterEl.textContent = current.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typewriterEl.textContent = current.substring(0, charIndex + 1);
    charIndex++;
  }
  let delay = isDeleting ? 60 : 100;
  if (!isDeleting && charIndex === current.length) {
    delay = 2000;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    delay = 400;
  }
  setTimeout(typeWriter, delay);
}
setTimeout(typeWriter, 2000);

// ==================== COUNTDOWN TIMER ====================
function updateCountdown() {
  const eventDate = new Date('2026-11-05T09:00:00');
  const now = new Date();
  const diff = eventDate - now;

  if (diff <= 0) {
    document.getElementById('cd-days').textContent = '00';
    document.getElementById('cd-hours').textContent = '00';
    document.getElementById('cd-mins').textContent = '00';
    document.getElementById('cd-secs').textContent = '00';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = n => String(n).padStart(2, '0');

  const updateNum = (id, val) => {
    const el = document.getElementById(id);
    if (el.textContent !== pad(val)) {
      el.style.transform = 'translateY(-10px)';
      el.style.opacity = '0';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        el.textContent = pad(val);
        el.style.transform = 'translateY(0)';
        el.style.opacity = '1';
      }, 150);
    }
  };

  updateNum('cd-days', days);
  updateNum('cd-hours', hours);
  updateNum('cd-mins', mins);
  updateNum('cd-secs', secs);
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ==================== NAVBAR ====================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 80) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Hamburger
document.getElementById('hamburger').addEventListener('click', () => {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  links.style.flexDirection = 'column';
  links.style.position = 'absolute';
  links.style.top = '70px';
  links.style.left = '0';
  links.style.right = '0';
  links.style.background = 'rgba(5,5,16,0.97)';
  links.style.padding = '2rem';
  links.style.backdropFilter = 'blur(20px)';
});

// ==================== SCROLL ANIMATIONS ====================
function initAnimations() {

  // Scroll reveal
  const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, parseInt(delay));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => observer.observe(el));

  // GSAP Hero animations
  gsap.from('.hero-badge', { duration: 1, y: -30, opacity: 0, delay: 0.2, ease: 'back.out(1.7)' });
  gsap.from('.hero-title', { duration: 1.2, y: 60, opacity: 0, delay: 0.4, ease: 'power4.out' });
  gsap.from('.hero-buttons', { duration: 1, y: 30, opacity: 0, delay: 0.8, ease: 'power3.out' });

  // Stats counter animation
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        statsObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });
  const statsEl = document.querySelector('.hero-stats');
  if (statsEl) statsObserver.observe(statsEl);

  // Timeline line scroll
  ScrollTrigger.create({
    trigger: '.timeline',
    start: 'top center',
    end: 'bottom center',
    scrub: 1,
    onUpdate: (self) => {
      const line = document.getElementById('timelineLine');
      const timeline = document.querySelector('.timeline');
      const totalHeight = timeline.offsetHeight;
      line.style.height = (self.progress * totalHeight) + 'px';
    }
  });

  // Parallax on sections
  gsap.utils.toArray('.section-bg-text').forEach(el => {
    gsap.to(el, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
  });

  // Track cards stagger with GSAP
  gsap.utils.toArray('.track-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 85%',
      onEnter: () => {
        gsap.from(card, {
          duration: 0.8,
          y: 50,
          opacity: 0,
          delay: i * 0.1,
          ease: 'power3.out'
        });
      },
      once: true
    });
  });

  // Prize cards pop in
  gsap.utils.toArray('.prize-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 80%',
      onEnter: () => {
        gsap.from(card, {
          duration: 0.9,
          scale: 0.7,
          opacity: 0,
          delay: i * 0.15,
          ease: 'back.out(1.5)'
        });
      },
      once: true
    });
  });

  // Horizontal scroll text effect on hero
  gsap.to('.hero-content', {
    yPercent: 20,
    opacity: 0.3,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });

  // Sponsor logos parallax
  gsap.to('.sponsor-logo', {
    scale: 1.05,
    ease: 'none',
    scrollTrigger: {
      trigger: '.sponsors',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1
    }
  });
}

// ==================== COUNTER ANIMATION ====================
function animateCounters() {
  const counters = document.querySelectorAll('.stat-num');
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      counter.textContent = Math.floor(current).toLocaleString();
    }, 16);
  });
}

// ==================== FAQ ACCORDION ====================
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const item = question.parentElement;
    const isOpen = item.classList.contains('open');

    // Close all
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));

    // Toggle clicked
    if (!isOpen) item.classList.add('open');
  });
});

// ==================== MOUSE TRAIL ====================
const trailColors = ['#6c63ff','#00f5d4','#ff6b9d','#ff9f43'];
let trailIndex = 0;
document.addEventListener('mousemove', (e) => {
  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  const size = Math.random() * 6 + 4;
  dot.style.cssText = `
    left: ${e.clientX}px; top: ${e.clientY}px;
    width: ${size}px; height: ${size}px;
    background: ${trailColors[trailIndex++ % trailColors.length]};
  `;
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 600);
});

// ==================== FLOATING BADGE GSAP ENHANCEMENT ====================
if (typeof gsap !== 'undefined') {
  document.querySelectorAll('.floating-badge').forEach((badge, i) => {
    gsap.to(badge, {
      y: -20,
      rotation: (i % 2 === 0 ? 3 : -3),
      duration: 2.5 + i * 0.4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: i * 0.3
    });
  });
}

// ==================== ROUNDS SECTION ANIMATION ====================
if (typeof gsap !== 'undefined') {
  gsap.utils.toArray('.round-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 85%',
      onEnter: () => {
        gsap.from(card, {
          duration: 0.9,
          y: 50,
          opacity: 0,
          scale: 0.95,
          delay: i * 0.2,
          ease: 'back.out(1.5)'
        });
      },
      once: true
    });
  });
}

// ==================== FORM SUBMIT ====================
const regForm = document.getElementById('registerForm');
if (regForm) regForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.innerHTML = '<span>🎉 You\'re Registered!</span>';
  btn.style.background = 'linear-gradient(135deg, #00f5d4, #6c63ff)';
  btn.disabled = true;

  // Confetti burst
  for (let i = 0; i < 80; i++) {
    createConfetti();
  }
  setTimeout(() => {
    btn.innerHTML = '<span>Secure Your Spot</span><div class="btn-glow"></div>';
    btn.disabled = false;
    btn.style.background = '';
  }, 4000);
});

function createConfetti() {
  const el = document.createElement('div');
  const colors = ['#6c63ff', '#00f5d4', '#ff6b9d', '#ff9f43', '#fff'];
  el.style.cssText = `
    position: fixed;
    top: ${Math.random() * 100}vh;
    left: ${Math.random() * 100}vw;
    width: ${Math.random() * 10 + 5}px;
    height: ${Math.random() * 10 + 5}px;
    background: ${colors[Math.floor(Math.random() * colors.length)]};
    border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    z-index: 9999;
    pointer-events: none;
    animation: confettiFall ${Math.random() * 2 + 1}s ease-out forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// Confetti CSS
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
  @keyframes confettiFall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
  }
`;
document.head.appendChild(confettiStyle);

// ==================== 3D TILT on TRACK CARDS ====================
document.querySelectorAll('.track-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -10;
    const rotY = ((x - cx) / cx) * 10;
    card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-10px)`;
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.4s ease';
  });
});

// ==================== PRIZE CARD TILT ====================
document.querySelectorAll('.prize-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    card.style.transform = `perspective(500px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-10px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.4s ease';
  });
});

// ==================== SMOOTH SCROLL NAV ====================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ==================== ACTIVE NAV LINK ====================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === '#' + entry.target.id) {
          link.style.color = 'var(--accent)';
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

// ==================== ABOUT ORB FLOAT ====================
gsap.to('.orbit-center', {
  boxShadow: '0 0 60px rgba(108,99,255,0.9), 0 0 100px rgba(0,245,212,0.4)',
  repeat: -1,
  yoyo: true,
  duration: 2,
  ease: 'power1.inOut'
});

// ==================== MOBILE NAV CLOSE on LINK CLICK ====================
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    if (window.innerWidth <= 1024) {
      links.style.display = 'none';
    }
  });
});

// ==================== PAGE VISIBILITY ANIMATION PAUSE ====================
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    particles.forEach(p => { p.vx = 0; p.vy = 0; });
  } else {
    particles.forEach(p => {
      p.vx = (Math.random() - 0.5) * 0.6;
      p.vy = (Math.random() - 0.5) * 0.6;
    });
  }
});

console.log('%c⚡ HackFusion 2026', 'color: #6c63ff; font-size: 2rem; font-weight: bold;');
console.log('%cBuilt for hackers, by hackers.', 'color: #00f5d4; font-size: 1rem;');
