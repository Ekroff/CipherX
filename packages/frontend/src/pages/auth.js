/* =============================================
   Authentication Pages
   ============================================= */

const shieldSVG = `<svg viewBox="0 0 32 32" fill="none"><path d="M16 2L4 8v8c0 7.2 5.1 13.9 12 16 6.9-2.1 12-8.8 12-16V8L16 2z" fill="#7C3AED"/><path d="M16 7a4 4 0 014 4v2h1a1 1 0 011 1v7a1 1 0 01-1 1H11a1 1 0 01-1-1v-7a1 1 0 011-1h1v-2a4 4 0 014-4zm0 2a2 2 0 00-2 2v2h4v-2a2 2 0 00-2-2zm0 7a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="#F3F0FA"/></svg>`;

function brandPanel() {
  return `
  <div class="auth-brand">
    <a href="#/" class="auth-brand-logo">${shieldSVG}<span>CipherX</span></a>
    <div class="auth-shield">
      ${shieldSVG}
      <div class="auth-shield-ring"></div>
    </div>
    <h2>Enterprise-Grade Cryptographic Security</h2>
    <p>Trusted by 500+ security teams worldwide</p>
    <div class="auth-trust-badges">
      <span class="auth-trust-badge">🔒 SOC 2 Certified</span>
      <span class="auth-trust-badge">🛡️ GDPR Compliant</span>
      <span class="auth-trust-badge">✅ ISO 27001</span>
    </div>
    <div class="auth-floating-badges">
      <div class="auth-float-badge success-badge">✅ 47 vulnerabilities resolved today</div>
      <div class="auth-float-badge danger-badge">🔴 Critical key exposure blocked</div>
    </div>
  </div>`;
}

function socialButtons(action) {
  return `
  <div class="auth-social-btns">
    <button class="auth-social-btn"><span class="icon">G</span> Continue with Google</button>
    <button class="auth-social-btn"><span class="icon">⌂</span> Continue with GitHub</button>
  </div>
  <div class="divider"><span>or ${action} with email</span></div>`;
}

function passwordStrengthMeter() {
  return `
  <div class="strength-meter" id="strengthMeter">
    <div class="seg"></div><div class="seg"></div><div class="seg"></div><div class="seg"></div>
  </div>
  <div class="strength-label" id="strengthLabel" style="color:var(--text-secondary)"></div>`;
}

function signupForm() {
  return `
  <div class="auth-form-card">
    <h2>Create your account</h2>
    <p class="subtitle">Start your free 14-day trial. No credit card required.</p>
    ${socialButtons('sign up')}
    <form class="auth-form" id="signupForm">
      <div class="input-group">
        <label>Full Name</label>
        <input type="text" class="input-field" placeholder="Jane Smith" required />
      </div>
      <div class="input-group">
        <label>Work Email</label>
        <input type="email" class="input-field" id="workEmail" placeholder="jane@company.com" required />
        <div class="input-error" id="emailError" style="display:none">Please use your work email</div>
      </div>
      <div class="input-group">
        <label>Company Name</label>
        <input type="text" class="input-field" placeholder="Acme Corp" required />
      </div>
      <div class="input-group">
        <label>Password</label>
        <div class="input-password-wrap">
          <input type="password" class="input-field" id="signupPassword" placeholder="Create a strong password" required />
          <button type="button" class="toggle-password" data-target="signupPassword">👁</button>
        </div>
        ${passwordStrengthMeter()}
      </div>
      <div class="checkbox-group" style="margin-bottom:var(--space-6)">
        <input type="checkbox" id="agreeTerms" required />
        <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
      </div>
      <button type="submit" class="auth-submit" id="signupBtn">Create Account →</button>
    </form>
    <div class="auth-footer">Already have an account? <a href="#/login">Log In</a></div>
  </div>`;
}

function loginForm() {
  return `
  <div class="auth-form-card">
    <h2>Welcome back</h2>
    <p class="subtitle">Sign in to your CipherX dashboard</p>
    ${socialButtons('sign in')}
    <form class="auth-form" id="loginForm">
      <div id="loginError" style="display:none" class="auth-error-alert">⚠ Incorrect email or password. Please try again.</div>
      <div class="input-group">
        <label>Work Email</label>
        <input type="email" class="input-field" placeholder="jane@company.com" required />
      </div>
      <div class="input-group">
        <label>Password</label>
        <div class="input-password-wrap">
          <input type="password" class="input-field" id="loginPassword" placeholder="Enter your password" required />
          <button type="button" class="toggle-password" data-target="loginPassword">👁</button>
        </div>
      </div>
      <div class="auth-actions">
        <div class="checkbox-group">
          <input type="checkbox" id="rememberMe" />
          <span>Keep me signed in for 30 days</span>
        </div>
        <a href="#/forgot-password" class="forgot-link">Forgot password?</a>
      </div>
      <button type="submit" class="auth-submit" id="loginBtn">Sign In →</button>
    </form>
    <div class="auth-footer">Don't have an account? <a href="#/signup">Start Free Trial</a></div>
  </div>`;
}

function forgotPasswordForm() {
  return `
  <div class="auth-form-card">
    <a href="#/login" class="auth-back-link">← Back to Login</a>
    <h2>Reset your password</h2>
    <p class="subtitle">Enter your work email and we'll send you a reset link.</p>
    <form class="auth-form" id="forgotForm">
      <div class="input-group">
        <label>Work Email</label>
        <input type="email" class="input-field" id="forgotEmail" placeholder="jane@company.com" required />
      </div>
      <button type="submit" class="auth-submit">Send Reset Link</button>
    </form>
  </div>`;
}

function forgotPasswordSuccess() {
  return `
  <div class="auth-form-card">
    <div class="auth-success">
      <div class="auth-success-icon">✓</div>
      <h3>Check your inbox</h3>
      <p>We've sent a password reset link to your email address.</p>
      <p style="margin-top:var(--space-3)"><a href="#" id="resendReset" style="color:var(--accent)">Didn't receive it? Resend email</a></p>
      <p style="margin-top:var(--space-4)"><a href="#/login" style="color:var(--text-secondary)">← Return to Login</a></p>
    </div>
  </div>`;
}

function resetPasswordForm() {
  return `
  <div class="auth-form-card">
    <h2>Set a new password</h2>
    <p class="subtitle">Must be at least 8 characters with one uppercase and one number.</p>
    <form class="auth-form" id="resetForm">
      <div class="input-group">
        <label>New Password</label>
        <div class="input-password-wrap">
          <input type="password" class="input-field" id="newPassword" placeholder="Enter new password" required />
          <button type="button" class="toggle-password" data-target="newPassword">👁</button>
        </div>
        ${passwordStrengthMeter()}
      </div>
      <div class="input-group">
        <label>Confirm Password</label>
        <div class="input-password-wrap">
          <input type="password" class="input-field" id="confirmPassword" placeholder="Confirm your password" required />
          <button type="button" class="toggle-password" data-target="confirmPassword">👁</button>
        </div>
        <div class="password-match" id="passwordMatch"></div>
      </div>
      <button type="submit" class="auth-submit">Update Password →</button>
    </form>
  </div>`;
}

function verifyEmailPage() {
  return `
  <div class="auth-form-card" style="text-align:center;">
    <div class="auth-verify-icon">✉️</div>
    <h2>Verify your email</h2>
    <p class="subtitle" style="max-width:320px;margin:0 auto var(--space-6);">We sent a verification link to your email. Click the link to activate your account.</p>
    <button class="btn btn-outline" style="margin-bottom:var(--space-4);width:100%;">Resend verification email</button>
    <p style="font-size:13px;"><a href="#/signup" style="color:var(--accent);">Wrong email? Sign up again</a></p>
    <p style="font-size:13px;margin-top:var(--space-3);"><a href="#/login" style="color:var(--text-secondary);">← Back to Login</a></p>
  </div>`;
}

function getFormContent(page) {
  switch (page) {
    case '/signup': return signupForm();
    case '/login': return loginForm();
    case '/forgot-password': return forgotPasswordForm();
    case '/reset-password': return resetPasswordForm();
    case '/verify-email': return verifyEmailPage();
    default: return loginForm();
  }
}

function setupPasswordToggle() {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁';
      }
    });
  });
}

function setupPasswordStrength() {
  const passwordInputs = document.querySelectorAll('#signupPassword, #newPassword');
  passwordInputs.forEach(input => {
    input.addEventListener('input', () => {
      const val = input.value;
      let level = 0;
      if (val.length >= 4) level = 1;
      if (val.length >= 8 && /[A-Z]/.test(val)) level = 2;
      if (val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val)) level = 3;
      if (val.length >= 12 && /[A-Z]/.test(val) && /[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val)) level = 4;

      const meter = document.getElementById('strengthMeter');
      const label = document.getElementById('strengthLabel');
      if (!meter || !label) return;

      meter.className = `strength-meter level-${level}`;
      const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
      const colors = ['', 'var(--danger)', 'var(--warning)', 'var(--purple-mid)', 'var(--success)'];
      label.textContent = labels[level] || '';
      label.style.color = colors[level] || 'var(--text-secondary)';
    });
  });
}

function setupPasswordMatch() {
  const confirm = document.getElementById('confirmPassword');
  const newPw = document.getElementById('newPassword');
  const matchEl = document.getElementById('passwordMatch');
  if (confirm && newPw && matchEl) {
    confirm.addEventListener('input', () => {
      if (confirm.value.length === 0) {
        matchEl.textContent = '';
        return;
      }
      if (confirm.value === newPw.value) {
        matchEl.textContent = '✅ Passwords match';
        matchEl.className = 'password-match match';
      } else {
        matchEl.textContent = '❌ Passwords do not match';
        matchEl.className = 'password-match no-match';
      }
    });
  }
}

function setupEmailValidation() {
  const emailInput = document.getElementById('workEmail');
  const error = document.getElementById('emailError');
  if (emailInput && error) {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    emailInput.addEventListener('blur', () => {
      const domain = emailInput.value.split('@')[1];
      if (domain && personalDomains.includes(domain.toLowerCase())) {
        error.style.display = 'block';
        emailInput.classList.add('error');
      } else {
        error.style.display = 'none';
        emailInput.classList.remove('error');
      }
    });
  }
}

function showAuthError(containerId, message) {
  let el = document.getElementById(containerId);
  if (!el) {
    el = document.createElement('div');
    el.id = containerId;
    el.className = 'auth-error-alert';
    const form = document.querySelector('.auth-form');
    if (form) form.prepend(el);
  }
  el.textContent = `⚠ ${message}`;
  el.style.display = 'block';
}

function setupFormSubmit() {

  // ---- Signup ----
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('signupBtn');
      btn.innerHTML = '<div class="spinner"></div> Creating account...';
      btn.classList.add('loading');

      const inputs = signupForm.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
      const [fullName, email, orgName, password] = Array.from(inputs).map(i => i.value);
      try {
        const { signup } = await import('../api/client.js');
        await signup({ fullName, email, password, orgName });
        window.location.hash = '/verify-email';
      } catch (err) {
        btn.innerHTML = 'Create Account →';
        btn.classList.remove('loading');
        let msg = err.message || 'Signup failed. Please try again.';
        if (msg.includes('no body') || msg.includes('not JSON')) {
          msg += ' The API backend may be unreachable—check that it is running and the correct URL is configured.';
        }
        showAuthError('signupError', msg);
      }
    });
  }


  // ---- Login ----
  const loginFormEl = document.getElementById('loginForm');
  if (loginFormEl) {
    loginFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      btn.innerHTML = '<div class="spinner"></div> Signing in...';
      btn.classList.add('loading');

      const emailInput = loginFormEl.querySelector('input[type="email"]');
      const passwordInput = loginFormEl.querySelector('input[type="password"]');
      const email = emailInput?.value;
      const password = passwordInput?.value;

      const errorEl = document.getElementById('loginError');
      if (errorEl) errorEl.style.display = 'none';

      try {
        const { login } = await import('../api/client.js');
        await login({ email, password });
        window.location.hash = '/dashboard';
      } catch (err) {
        btn.innerHTML = 'Sign In →';
        btn.classList.remove('loading');
        if (errorEl) {
          errorEl.textContent = `⚠ ${err.message || 'Incorrect email or password. Please try again.'}`;
          errorEl.style.display = 'block';
        }
      }
    });
  }

  // ---- Forgot password ----
  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = forgotForm.querySelector('button[type="submit"]');
      btn.innerHTML = '<div class="spinner"></div> Sending...';
      btn.classList.add('loading');

      const emailInput = document.getElementById('forgotEmail');
      const email = emailInput?.value;

      try {
        const { forgotPassword } = await import('../api/client.js');
        await forgotPassword({ email });
      } catch (_) {
        // Always show success to prevent email enumeration
      } finally {
        const panel = document.querySelector('.auth-form-panel');
        if (panel) panel.innerHTML = forgotPasswordSuccess();
      }
    });
  }

  // ---- Reset password ----
  const resetForm = document.getElementById('resetForm');
  if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const matchEl = document.getElementById('passwordMatch');
      if (matchEl && matchEl.classList.contains('no-match')) return;

      const panel = document.querySelector('.auth-form-panel');
      if (panel) {
        panel.innerHTML = `
          <div class="auth-form-card">
            <div class="auth-success">
              <div class="auth-success-icon">✓</div>
              <h3>Password updated successfully!</h3>
              <p>Redirecting to login in <span id="countdown">3</span>s...</p>
              <div class="progress-bar" style="max-width:200px;margin:var(--space-4) auto;">
                <div class="fill" style="width:0%;transition:width 3s linear;"></div>
              </div>
            </div>
          </div>`;
        setTimeout(() => {
          const fill = panel.querySelector('.fill');
          if (fill) fill.style.width = '100%';
        }, 50);
        let count = 3;
        const interval = setInterval(() => {
          count--;
          const el = document.getElementById('countdown');
          if (el) el.textContent = count;
          if (count <= 0) {
            clearInterval(interval);
            window.location.hash = '/login';
          }
        }, 1000);
      }
    });
  }
}

export function renderAuth(appEl, route) {
  const page = route || '/login';

  appEl.innerHTML = `
    <div class="auth-layout">
      ${brandPanel()}
      <div class="auth-form-panel">
        ${getFormContent(page)}
      </div>
    </div>
  `;

  // Setup interactions
  setupPasswordToggle();
  setupPasswordStrength();
  setupPasswordMatch();
  setupEmailValidation();
  setupFormSubmit();
}
