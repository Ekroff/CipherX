/* =============================================
   Landing Page — All 10 Sections
   ============================================= */
import { pricingPlans, testimonials } from '../data/data.js';

const shieldLogo = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2L4 8v8c0 7.2 5.1 13.9 12 16 6.9-2.1 12-8.8 12-16V8L16 2z" fill="#7C3AED"/><path d="M16 7a4 4 0 014 4v2h1a1 1 0 011 1v7a1 1 0 01-1 1H11a1 1 0 01-1-1v-7a1 1 0 011-1h1v-2a4 4 0 014-4zm0 2a2 2 0 00-2 2v2h4v-2a2 2 0 00-2-2zm0 7a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="#F3F0FA"/></svg>`;

function renderNavbar() {
  return `
  <nav class="navbar" id="navbar">
    <div class="container">
      <a href="#/" class="navbar-logo">${shieldLogo}<span>CipherX</span></a>
      <div class="navbar-links">
        <a href="#features">Features</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#integrations">Integrations</a>
        <a href="#compliance">Compliance</a>
        <a href="#pricing">Pricing</a>
      </div>
      <div class="navbar-actions">
        <a href="#/login" class="btn btn-ghost btn-sm">Log In</a>
        <a href="#/signup" class="btn btn-primary btn-sm" style="height:38px;padding:10px 20px;font-size:14px;">Start Free Trial</a>
      </div>
      <button class="hamburger" id="hamburgerBtn" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
  <div class="mobile-nav" id="mobileNav">
    <button class="close-nav" id="closeNav">✕</button>
    <a href="#features" onclick="document.getElementById('mobileNav').classList.remove('active')">Features</a>
    <a href="#how-it-works" onclick="document.getElementById('mobileNav').classList.remove('active')">How It Works</a>
    <a href="#integrations" onclick="document.getElementById('mobileNav').classList.remove('active')">Integrations</a>
    <a href="#pricing" onclick="document.getElementById('mobileNav').classList.remove('active')">Pricing</a>
    <a href="#/login" class="btn btn-outline" onclick="document.getElementById('mobileNav').classList.remove('active')">Log In</a>
    <a href="#/signup" class="btn btn-primary" onclick="document.getElementById('mobileNav').classList.remove('active')">Start Free Trial</a>
  </div>`;
}

function renderHero() {
  return `
  <section class="hero">
    <div class="container">
      <div class="hero-left">
        <div class="hero-eyebrow">🔐 Trusted by 500+ Enterprise Security Teams</div>
        <h1 class="hero-title">Find. Fix. Fortify.<br/>Your <span class="gradient">Cryptographic</span> Security.</h1>
        <p class="hero-subtitle">CipherX automatically discovers every encryption vulnerability across your entire codebase — and gives developers the exact fix in seconds.</p>
        <div class="hero-ctas">
          <a href="#/signup" class="btn btn-primary">Start Free Trial →</a>
          <a href="#demo" class="btn btn-secondary">Watch Demo ▶</a>
        </div>
        <p class="hero-micro">No credit card required · SOC 2 Compliant · Free 14-day trial</p>
        <div class="hero-social">
          <span>Trusted by security teams at</span>
          <div class="logos">
            <div class="logo-placeholder"></div>
            <div class="logo-placeholder"></div>
            <div class="logo-placeholder"></div>
            <div class="logo-placeholder"></div>
            <div class="logo-placeholder"></div>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-orb"></div>
        <div class="hero-mockup">
          <div class="hero-mockup-header">
            <div class="hero-mockup-dot" style="background:#C0392B"></div>
            <div class="hero-mockup-dot" style="background:#D4821A"></div>
            <div class="hero-mockup-dot" style="background:#1A7A4A"></div>
            <span style="font-size:12px;color:var(--text-secondary);margin-left:8px;">CipherX — Vulnerability Tracker</span>
          </div>
          <div style="display:flex;gap:12px;margin-bottom:12px;">
            <div class="card" style="flex:1;padding:16px;border:none;cursor:default;">
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">Risk Score</div>
              <div style="font-family:var(--font-display);font-weight:700;font-size:28px;color:var(--danger);">72</div>
              <div style="width:100%;height:4px;background:var(--border);border-radius:4px;margin-top:8px;"><div style="width:72%;height:100%;background:var(--danger);border-radius:4px;"></div></div>
            </div>
            <div class="card" style="flex:1;padding:16px;border:none;cursor:default;">
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">Critical Issues</div>
              <div style="font-family:var(--font-display);font-weight:700;font-size:28px;color:var(--accent);">12</div>
              <div style="font-size:11px;color:var(--success);margin-top:8px;">↓ 3 from last week</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--bg-page);border-radius:8px;">
              <span class="severity-tag severity-critical">Critical</span>
              <span style="font-size:12px;flex:1;">MD5 in payment-gateway</span>
              <span style="font-size:11px;color:var(--text-secondary);">2h ago</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--bg-page);border-radius:8px;">
              <span class="severity-tag severity-high">High</span>
              <span style="font-size:12px;flex:1;">SHA-1 in auth-service</span>
              <span style="font-size:11px;color:var(--text-secondary);">4h ago</span>
            </div>
          </div>
        </div>
        <div class="hero-badge hero-badge-alert animate-float">🔴 Critical Alert Blocked</div>
        <div class="hero-badge hero-badge-fix animate-float">✅ Fix Applied in 8s</div>
      </div>
    </div>
  </section>`;
}

function renderPainSection() {
  return `
  <section class="pain-section">
    <div class="container">
      <h2 class="section-title">Why Cryptographic Security Keeps Failing</h2>
      <div class="pain-grid">
        <div class="flip-card">
          <div class="flip-card-inner">
            <div class="flip-card-front pain-card">
              <div class="pain-icon" style="background:rgba(91,46,191,0.1);color:var(--purple-mid);">🧠</div>
              <h3>The Black Box Problem</h3>
              <p>Developers aren't cryptographers. They copy-paste deprecated algorithms like MD5, use insecure defaults, and accidentally hardcode master keys into source code.</p>
              <span class="pain-tag" style="background:var(--bg-card);color:var(--purple-mid);">Root Cause</span>
            </div>
            <div class="flip-card-back">
              <div class="flip-back-icon">🔧</div>
              <h3>CipherX Solution</h3>
              <p>Automated detection of every cryptographic function — with guided, copy-paste fixes tailored to your framework.</p>
              <a href="#features" class="btn btn-primary btn-sm" style="margin-top:auto;">Learn More →</a>
            </div>
          </div>
        </div>
        <div class="flip-card">
          <div class="flip-card-inner">
            <div class="flip-card-front pain-card">
              <div class="pain-icon" style="background:rgba(91,46,191,0.1);color:var(--purple-mid);">👻</div>
              <h3>You Can't Secure What You Can't See</h3>
              <p>Cryptography exists across thousands of microservices your security team never approved, documented, or has any visibility into.</p>
              <span class="pain-tag" style="background:var(--bg-card);color:var(--purple-mid);">Blind Spot</span>
            </div>
            <div class="flip-card-back">
              <div class="flip-back-icon">📦</div>
              <h3>Full CBOM Inventory</h3>
              <p>Real-time cryptographic bill of materials across every repo, container, and infrastructure component.</p>
              <a href="#features" class="btn btn-primary btn-sm" style="margin-top:auto;">Learn More →</a>
            </div>
          </div>
        </div>
        <div class="flip-card">
          <div class="flip-card-inner">
            <div class="flip-card-front pain-card">
              <div class="pain-icon" style="background:rgba(91,46,191,0.1);color:var(--purple-mid);">🔔</div>
              <h3>Drowning in False Positives</h3>
              <p>Legacy SAST tools flood SOC teams with thousands of flagged issues daily. Critical vulnerabilities get buried in the noise.</p>
              <span class="pain-tag" style="background:var(--bg-card);color:var(--purple-mid);">Operational Failure</span>
            </div>
            <div class="flip-card-back">
              <div class="flip-back-icon">🎯</div>
              <h3>Context-Aware Scoring</h3>
              <p>98% false positive reduction. Only the vulnerabilities that actually matter reach your team.</p>
              <a href="#features" class="btn btn-primary btn-sm" style="margin-top:auto;">Learn More →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function renderFeaturesSection() {
  const features = [
    { icon: '📦', tag: 'DISCOVER', title: 'Automated Cryptographic Bill of Materials', body: 'Continuously scans every repo, container, and infrastructure component to build a real-time master inventory of every algorithm, key length, and TLS certificate in use.', bullets: ['Real-time scanning', 'Container support', 'Git integration'], reverse: false, visual: renderCBOMVisual() },
    { icon: '🎯', tag: 'PRIORITIZE', title: 'Signal Over Noise — Context-Aware Risk Scoring', body: 'Correlates vulnerabilities with actual business exposure. A weak algorithm on an isolated dev server is deprioritized. A hardcoded key on your public API triggers an immediate critical alert.', bullets: ['Business context', 'Exposure mapping', 'Smart ranking'], reverse: true, visual: renderPriorityVisual() },
    { icon: '⚙️', tag: 'PREVENT', title: 'Block Vulnerabilities Before They Hit Production', body: 'Integrates directly into GitHub Actions, GitLab CI, Jenkins, and Bitbucket. Automatically blocks pull requests containing exposed secrets or unsalted hashes — before a single line merges.', bullets: ['GitHub Actions', 'GitLab CI', 'Jenkins'], reverse: false, visual: renderCICDVisual() },
    { icon: '🔧', tag: 'FIX', title: 'Exact Fix Delivered Instantly', body: "When a vulnerability is caught, CipherX doesn't just alert — it delivers a secure, copy-pasteable code snippet for your exact framework. No research needed.", bullets: ['Copy-paste fixes', 'Framework-aware', 'PR ready'], reverse: true, visual: renderRemediationVisual() },
    { icon: '📊', tag: 'REPORT', title: 'Audit-Ready Compliance in One Dashboard', body: 'Maps every vulnerability directly to OWASP, NIST SP 800-131A, and PCI-DSS controls. Export executive-ready PDF reports in one click.', bullets: ['OWASP mapping', 'NIST compliance', 'PCI-DSS'], reverse: false, visual: renderComplianceVisual(), id: 'compliance' },
  ];

  return `
  <section class="features-section" id="features">
    <div class="container">
      <div class="features-eyebrow">THE CIPHERX SOLUTION</div>
      <h2 class="features-title">Five Pillars of Cryptographic Security</h2>
      ${features.map(f => `
        <div class="feature-row ${f.reverse ? 'reverse' : ''}" ${f.id ? `id="${f.id}"` : ''}>
          <div class="feature-text">
            <div class="feature-icon">${f.icon}</div>
            <div class="feature-tag">${f.tag}</div>
            <h3>${f.title}</h3>
            <p>${f.body}</p>
            <div class="feature-bullets">${f.bullets.map(b => `<span>${b}</span>`).join('')}</div>
          </div>
          <div class="feature-visual">${f.visual}</div>
        </div>
      `).join('')}
    </div>
  </section>`;
}

function renderCBOMVisual() {
  return `<table class="feature-mini-table"><thead><tr><th>Algorithm</th><th>Count</th><th>Status</th></tr></thead><tbody>
    <tr><td>AES-256-GCM</td><td>142</td><td><span class="severity-tag severity-info" style="font-size:10px;">Secure</span></td></tr>
    <tr><td>SHA-256</td><td>89</td><td><span class="severity-tag severity-info" style="font-size:10px;">Secure</span></td></tr>
    <tr><td>MD5</td><td>23</td><td><span class="severity-tag severity-critical" style="font-size:10px;">Critical</span></td></tr>
    <tr><td>SHA-1</td><td>15</td><td><span class="severity-tag severity-high" style="font-size:10px;">High</span></td></tr>
    <tr><td>RSA-1024</td><td>7</td><td><span class="severity-tag severity-medium" style="font-size:10px;">Medium</span></td></tr>
  </tbody></table>`;
}

function renderPriorityVisual() {
  return `<div style="display:flex;flex-direction:column;gap:12px;">
    <div style="padding:16px;background:var(--bg-page);border-radius:10px;border-left:3px solid var(--success);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-weight:600;font-size:13px;">SHA-1 in test-utils</span>
        <span class="pill pill-success" style="font-size:10px;">Low Priority</span>
      </div>
      <span style="font-size:12px;color:var(--text-secondary);">Dev environment · No external exposure · Tests only</span>
    </div>
    <div style="padding:16px;background:var(--bg-page);border-radius:10px;border-left:3px solid var(--danger);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span style="font-weight:600;font-size:13px;">Hardcoded Key in payment-api</span>
        <span class="pill pill-danger animate-pulse" style="font-size:10px;">CRITICAL</span>
      </div>
      <span style="font-size:12px;color:var(--text-secondary);">Production · Public API · Customer PII</span>
    </div>
  </div>`;
}

function renderCICDVisual() {
  return `<div style="background:#1a1028;border-radius:10px;padding:16px;color:#e0d4f7;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <span style="font-size:14px;">❌</span>
      <span style="font-size:13px;font-family:var(--font-mono);color:var(--danger);">CipherX: Blocked</span>
    </div>
    <div style="font-family:var(--font-mono);font-size:12px;line-height:1.8;">
      <div style="color:var(--text-secondary);">PR #347 — Update payment handler</div>
      <div style="color:var(--danger);">⚠ Hardcoded API key detected in src/config.js:42</div>
      <div style="color:var(--danger);">⚠ MD5 hash used in src/auth/verify.js:18</div>
      <div style="margin-top:8px;padding:8px;background:rgba(124,58,237,0.15);border-radius:6px;color:var(--hover-glow);">💡 2 auto-fixes available — click to apply</div>
    </div>
  </div>`;
}

function renderRemediationVisual() {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    <div>
      <div style="font-size:11px;font-weight:600;margin-bottom:6px;color:var(--danger);">❌ Vulnerable</div>
      <div class="code-block vulnerable" style="padding:12px;font-size:11px;">
        <pre style="font-size:11px;color:#e0d4f7;">MessageDigest md =\n  MessageDigest\n  .getInstance("MD5");</pre>
      </div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:600;margin-bottom:6px;color:var(--success);">✅ Secure</div>
      <div class="code-block secure" style="padding:12px;font-size:11px;">
        <pre style="font-size:11px;color:#e0d4f7;">MessageDigest md =\n  MessageDigest\n  .getInstance("SHA-256");</pre>
      </div>
    </div>
  </div>`;
}

function renderComplianceVisual() {
  const gauges = [
    { label: 'OWASP', pct: 78, color: 'var(--accent)' },
    { label: 'NIST', pct: 91, color: 'var(--success)' },
    { label: 'PCI-DSS', pct: 65, color: 'var(--warning)' },
  ];
  return `<div style="display:flex;justify-content:space-around;padding:12px 0;">
    ${gauges.map(g => {
    const c = 2 * Math.PI * 45;
    const offset = c - (g.pct / 100) * c;
    return `<div class="gauge" style="width:100px;height:100px;">
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle class="track" cx="50" cy="50" r="45"/>
          <circle class="fill-ring" cx="50" cy="50" r="45" stroke="${g.color}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="value" style="font-size:18px;">${g.pct}%</div>
      </div>
      <div style="text-align:center;font-size:12px;color:var(--text-secondary);margin-top:-8px;">${g.label}</div>`;
  }).join('')}
  </div>`;
}

function renderStepsSection() {
  return `
  <section class="steps-section" id="how-it-works">
    <div class="container">
      <h2 class="section-title">Up and Running in 3 Steps</h2>
      <div class="steps-flow">
        <div class="step-card">
          <div class="step-number">01</div>
          <div class="step-icon">🔗</div>
          <h3>Connect Your Repositories</h3>
          <p>Link GitHub, GitLab, or Bitbucket in under 60 seconds. No agents to install.</p>
        </div>
        <div class="step-card">
          <div class="step-number">02</div>
          <div class="step-icon">🔍</div>
          <h3>Automated Full-Stack Scan</h3>
          <p>CipherX immediately scans all repos, containers, and infrastructure for cryptographic assets and vulnerabilities.</p>
        </div>
        <div class="step-card">
          <div class="step-number">03</div>
          <div class="step-icon">🛡️</div>
          <h3>Receive Fix. Ship Secure Code.</h3>
          <p>Get exact remediation code for each finding. Block issues in CI/CD before they reach production.</p>
        </div>
      </div>
    </div>
  </section>`;
}

function renderTestimonialsSection() {
  return `
  <section class="testimonial-section">
    <div class="container">
      <h2 class="section-title">Trusted by Security Teams at Scale</h2>
      <div class="testimonial-grid">
        ${testimonials.map(t => `
          <div class="testimonial-card">
            <div class="testimonial-stars">${'★'.repeat(t.stars)}</div>
            <blockquote>"${t.quote}"</blockquote>
            <div class="testimonial-author">
              <div class="testimonial-avatar">${t.name.split(' ').map(n => n[0]).join('')}</div>
              <div class="testimonial-info">
                <div class="name">${t.name}</div>
                <div class="role">${t.role}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="stats-bar">
        <div class="stat-item"><div class="value">500+</div><div class="label">Enterprise Teams</div></div>
        <div class="stat-item"><div class="value">2.4M</div><div class="label">Vulnerabilities Detected</div></div>
        <div class="stat-item"><div class="value">98%</div><div class="label">False Positive Reduction</div></div>
        <div class="stat-item"><div class="value">&lt;30s</div><div class="label">Average Time to Fix</div></div>
      </div>
    </div>
  </section>`;
}

function renderIntegrationsSection() {
  const items = ['🐙 GitHub', '🦊 GitLab', '🪣 Bitbucket', '🔧 Jenkins', '⚡ CircleCI', '☁️ AWS', '🔵 Azure', '🌐 GCP', '🐳 Docker', '☸️ Kubernetes', '🏗️ Terraform', '📋 Jira'];
  const doubled = [...items, ...items];
  return `
  <section class="integrations-section" id="integrations">
    <div class="container">
      <h2 class="integrations-title">Works With Your Stack</h2>
      <div class="marquee-container">
        <div class="marquee-track">
          ${doubled.map(i => {
    const [icon, ...name] = i.split(' ');
    return `<div class="marquee-item"><span class="icon">${icon}</span>${name.join(' ')}</div>`;
  }).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

function renderPricingSection() {
  return `
  <section class="pricing-section" id="pricing">
    <div class="container">
      <h2 class="section-title">Simple, Transparent Pricing</h2>
      <div class="pricing-toggle">
        <span class="active" id="monthlyLabel">Monthly</span>
        <div class="toggle-switch" id="pricingToggle"></div>
        <span id="annualLabel">Annual</span>
        <span class="save-badge">Save 20%</span>
      </div>
      <div class="pricing-grid">
        ${pricingPlans.map(plan => `
          <div class="pricing-card ${plan.highlighted ? 'highlighted' : ''}">
            ${plan.badge ? `<div class="pricing-badge">${plan.badge}</div>` : ''}
            <div class="plan-name">${plan.name}</div>
            <div class="plan-price">${plan.price}<span>${plan.period}</span></div>
            <div class="plan-subtitle">${plan.subtitle}</div>
            <div class="pricing-features">
              ${plan.features.map(f => `<div class="feature"><span class="check">✓</span> ${f}</div>`).join('')}
            </div>
            <a href="#/signup" class="btn ${plan.highlighted ? 'btn-primary' : 'btn-outline'} btn-full">${plan.cta}</a>
          </div>
        `).join('')}
      </div>
    </div>
  </section>`;
}

function renderCTABanner() {
  return `
  <section class="cta-banner">
    <div class="container">
      <h2>Your Codebase Has Cryptographic Vulnerabilities Right Now.</h2>
      <p>Find them in under 60 seconds.</p>
      <a href="#/signup" class="btn btn-primary">Start Free Trial — No Credit Card Needed</a>
    </div>
  </section>`;
}

function renderFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="logo">${shieldLogo}<span>CipherX</span></div>
          <p class="tagline">Automated Cryptographic Security for the Modern Enterprise</p>
          <div class="footer-social">
            <a href="#" aria-label="LinkedIn">in</a>
            <a href="#" aria-label="GitHub">⌂</a>
            <a href="#" aria-label="Twitter">𝕏</a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Product</h4>
          <a href="#features">Features</a>
          <a href="#integrations">Integrations</a>
          <a href="#pricing">Pricing</a>
          <a href="#">Changelog</a>
          <a href="#">Roadmap</a>
        </div>
        <div class="footer-col">
          <h4>Resources</h4>
          <a href="#">Documentation</a>
          <a href="#">API Reference</a>
          <a href="#">Blog</a>
          <a href="#">Security Advisories</a>
          <a href="#">OWASP Guide</a>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <a href="#">About</a>
          <a href="#">Careers</a>
          <a href="#">Press</a>
          <a href="#">Contact</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms</a>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="copyright">© 2026 CipherX. All rights reserved.</div>
        <div class="badges">
          <span class="badge">SOC 2 Type II Certified</span>
          <span class="badge">GDPR Compliant</span>
        </div>
      </div>
    </div>
  </footer>`;
}

export function renderLanding(appEl) {
  appEl.innerHTML = `
    ${renderNavbar()}
    ${renderHero()}
    ${renderPainSection()}
    ${renderFeaturesSection()}
    ${renderStepsSection()}
    ${renderIntegrationsSection()}
    ${renderPricingSection()}
    ${renderCTABanner()}
    ${renderFooter()}
  `;

  // Hamburger toggle
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  const closeNav = document.getElementById('closeNav');
  if (hamburger) hamburger.addEventListener('click', () => mobileNav.classList.add('active'));
  if (closeNav) closeNav.addEventListener('click', () => mobileNav.classList.remove('active'));

  // Pricing toggle
  const toggle = document.getElementById('pricingToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      const isAnnual = toggle.classList.contains('active');
      document.getElementById('monthlyLabel').classList.toggle('active', !isAnnual);
      document.getElementById('annualLabel').classList.toggle('active', isAnnual);
      // Update prices (simplified)
      const priceEls = document.querySelectorAll('.plan-price');
      priceEls.forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('$49')) el.innerHTML = isAnnual ? '$39<span>/mo</span>' : '$49<span>/mo</span>';
        if (text.includes('$149') || text.includes('$119')) el.innerHTML = isAnnual ? '$119<span>/mo</span>' : '$149<span>/mo</span>';
      });
    });
  }

  // Intersection observer for fade-in animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.pain-card, .feature-row, .step-card, .testimonial-card, .pricing-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
  });

  return () => observer.disconnect();
}
