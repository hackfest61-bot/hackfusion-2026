/* ==================== LOGIN.JS ==================== */

window.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  const user = getCurrentUser();
  if (user) {
    if (user.role === 'admin') window.location.href = 'admin.html';
    // (participants stay on login for demo purposes)
  }

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('forgotForm').addEventListener('submit', handleForgot);
});

function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEmail = document.getElementById('err-login-email');
  const errPw    = document.getElementById('err-login-password');
  const errBox   = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');

  errEmail.textContent = '';
  errPw.textContent    = '';
  errBox.classList.add('hidden');

  if (!email) { errEmail.textContent = 'Email is required.'; return; }
  if (!password) { errPw.textContent = 'Password is required.'; return; }

  // Loading state
  btn.innerHTML = '<span>⏳ Logging in...</span>';
  btn.disabled  = true;

  setTimeout(() => {
    const user = findUser(email, password);
    if (!user) {
      errBox.classList.remove('hidden');
      btn.innerHTML = '<span>Login →</span><div class="btn-glow"></div>';
      btn.disabled  = false;
      // Shake animation
      document.getElementById('loginCard').style.animation = 'shake 0.4s ease';
      setTimeout(() => document.getElementById('loginCard').style.animation = '', 400);
      return;
    }

    setCurrentUser(user);

    if (document.getElementById('rememberMe').checked) {
      localStorage.setItem('hf_rememberEmail', email);
    }

    showToast(`Welcome back, ${user.name}! 👋`, 'success');

    btn.innerHTML = '<span>✅ Success!</span>';
    btn.style.background = 'linear-gradient(135deg,#22c55e,#00f5d4)';

    setTimeout(() => {
      if (user.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 800);
  }, 700); // simulate async
}

function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  const err   = document.getElementById('err-forgot-email');
  err.textContent = '';

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    err.textContent = 'Enter a valid email address.'; return;
  }

  // Simulate sending
  const btn = e.target.querySelector('button[type="submit"]');
  btn.innerHTML = '<span>⏳ Sending...</span>';
  btn.disabled  = true;
  setTimeout(() => {
    show('forgotSuccess');
    btn.innerHTML = '<span>Send Reset Link</span>';
    btn.disabled  = false;
  }, 1200);
}

function showForgot(e) {
  e.preventDefault();
  hide('loginCard');
  show('forgotCard');
  const card = document.getElementById('forgotCard');
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = 'cardSlideIn 0.4s ease both';
}

function hideForgot() {
  hide('forgotCard');
  hide('forgotSuccess');
  show('loginCard');
}

function socialLogin(provider) {
  showToast(`${provider === 'github' ? '🐙 GitHub' : '🔵 Google'} login coming soon!`, 'info');
}

// Shake animation for failed login
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-8px); }
    40%     { transform: translateX(8px); }
    60%     { transform: translateX(-5px); }
    80%     { transform: translateX(5px); }
  }
`;
document.head.appendChild(shakeStyle);

// Pre-fill remembered email
const remembered = localStorage.getItem('hf_rememberEmail');
if (remembered) {
  const emailInput = document.getElementById('login-email');
  if (emailInput) {
    emailInput.value = remembered;
    document.getElementById('rememberMe').checked = true;
  }
}
