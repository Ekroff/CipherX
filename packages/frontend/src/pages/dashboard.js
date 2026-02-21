/* =============================================
   Dashboard Shell + All Sub-Pages
   ============================================= */
import { repositories as mockRepos, findings as mockFindings, complianceData, integrations, billingData, auditLogs, dashboardStats as mockStats } from '../data/data.js';
import { getDashboardStats, getRepos, getFindings, isAuthenticated, getUser } from '../api/client.js';

// Live data cache (populated async after initial render)
let liveStats = null;
let liveRepos = null;
let liveFindings = null;

// Resolved data helpers — fall back to mock data if live not available
function repositories() { return liveRepos || mockRepos; }
function findings() { return liveFindings || mockFindings; }
function dashboardStats() { return liveStats || mockStats; }



const shieldLogo = `<svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 2L4 8v8c0 7.2 5.1 13.9 12 16 6.9-2.1 12-8.8 12-16V8L16 2z" fill="#7C3AED"/><path d="M16 7a4 4 0 014 4v2h1a1 1 0 011 1v7a1 1 0 01-1 1H11a1 1 0 01-1-1v-7a1 1 0 011-1h1v-2a4 4 0 014-4zm0 2a2 2 0 00-2 2v2h4v-2a2 2 0 00-2-2zm0 7a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="#F3F0FA"/></svg>`;

const navItems = [
  { section: 'OVERVIEW' },
  { icon: '📊', label: 'Dashboard', route: '/dashboard' },
  { icon: '📁', label: 'Repositories', route: '/repositories' },
  { section: 'SECURITY' },
  { icon: '🔍', label: 'Findings', route: '/findings' },
  { icon: '🎯', label: 'Risk Prioritization', route: '/risk' },
  { icon: '🔧', label: 'Remediation Center', route: '/remediation' },
  { icon: '📋', label: 'Compliance', route: '/compliance' },
  { section: 'MANAGE' },
  { icon: '🔗', label: 'Integrations', route: '/integrations' },
  { icon: '💳', label: 'Billing', route: '/billing' },
  { icon: '⚙️', label: 'Settings', route: '/settings' },
  { icon: '📜', label: 'Audit Logs', route: '/audit-logs' },
];

function renderSidebar(activeRoute) {
  const activeKey = '/' + (activeRoute.split('/')[1] || 'dashboard');
  return `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <a href="#/dashboard" class="sidebar-logo">${shieldLogo}<span>CipherX</span></a>
      <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">☰</button>
    </div>
    <nav class="sidebar-nav">
      ${navItems.map(item => {
    if (item.section) return `<div class="sidebar-section-label">${item.section}</div>`;
    return `<a href="#${item.route}" class="sidebar-link ${activeKey === item.route ? 'active' : ''}" data-route="${item.route}"><span class="icon">${item.icon}</span><span class="label">${item.label}</span></a>`;
  }).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-avatar">SC</div>
        <div class="sidebar-user-info">
          <div class="name">Sarah Chen</div>
          <div class="email">sarah@fintechcorp.com</div>
        </div>
      </div>
    </div>
  </aside>`;
}

function renderTopbar() {
  return `
  <header class="topbar">
    <div class="topbar-left">
      <div class="org-switcher">
        <span>🏢</span>
        <span>FinTech Corp</span>
        <span class="arrow">▾</span>
      </div>
      <div class="topbar-search">
        <span>🔍</span>
        <span>Search...</span>
        <kbd>⌘K</kbd>
      </div>
    </div>
    <div class="topbar-right">
      <div class="usage-meter">
        <div class="bar"><div class="fill" style="width:74%"></div></div>
        <span class="label">7.4k / 10k AI tokens</span>
      </div>
      <div class="topbar-icon-btn">🔔<div class="topbar-badge"></div></div>
      <div class="topbar-icon-btn" onclick="window.location.hash='/settings'">⚙️</div>
      <div class="sidebar-avatar" style="width:32px;height:32px;font-size:12px;cursor:pointer;">SC</div>
    </div>
  </header>`;
}

// ==================== PAGE RENDER FUNCTIONS ====================

function renderMainDashboard() {
  const s = dashboardStats();
  const maxVal = Math.max(...s.trendData);
  return `
    <div class="page-header"><h1>Dashboard</h1>
      <div class="filters-row">
        <select class="filter-select"><option>All Repos</option>${repositories().map(r => `<option>${r.name}</option>`).join('')}</select>
        <select class="filter-select"><option>All Severities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
        <select class="filter-select"><option>All Environments</option><option>Production</option><option>Staging</option><option>Development</option></select>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Risk Score</div><div class="stat-value" style="color:var(--danger)">${s.riskScore}</div><div class="stat-change negative">↑ 4 from last week</div></div>
      <div class="stat-card"><div class="stat-label">Total Findings</div><div class="stat-value">${s.totalFindings}</div><div class="stat-change negative">↑ 12 new</div></div>
      <div class="stat-card"><div class="stat-label">Critical Issues</div><div class="stat-value" style="color:var(--danger)">${s.criticalIssues}</div><div class="stat-change positive">↓ 3 resolved</div></div>
      <div class="stat-card"><div class="stat-label">AI Suggestions</div><div class="stat-value" style="color:var(--accent)">${s.aiSuggestions}</div><div class="stat-change positive">Ready to apply</div></div>
    </div>
    <div class="chart-card">
      <h3>Findings Trend — Last 30 Days</h3>
      <div class="chart-area">
        ${s.trendData.map(v => `<div class="chart-bar" style="height:${(v / maxVal) * 100}%" data-tooltip="${v}"></div>`).join('')}
      </div>
    </div>
    <div class="chart-card">
      <h3>Crypto Inventory Snapshot</h3>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4);padding:var(--space-4) 0;">
        <div style="text-align:center;"><div style="font-family:var(--font-display);font-weight:700;font-size:24px;color:var(--success);">142</div><div style="font-size:12px;color:var(--text-secondary);">AES-256</div></div>
        <div style="text-align:center;"><div style="font-family:var(--font-display);font-weight:700;font-size:24px;color:var(--success);">89</div><div style="font-size:12px;color:var(--text-secondary);">SHA-256</div></div>
        <div style="text-align:center;"><div style="font-family:var(--font-display);font-weight:700;font-size:24px;color:var(--danger);">23</div><div style="font-size:12px;color:var(--text-secondary);">MD5</div></div>
        <div style="text-align:center;"><div style="font-family:var(--font-display);font-weight:700;font-size:24px;color:var(--warning);">15</div><div style="font-size:12px;color:var(--text-secondary);">SHA-1</div></div>
      </div>
    </div>`;
}

function renderRepositories() {
  return `
    <div class="page-header"><h1>Repositories</h1><button class="btn btn-primary btn-sm">+ Add Repository</button></div>
    <div class="card card-flat" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead><tr><th>Repo Name</th><th>Last Scan</th><th>Risk Score</th><th>Findings</th><th>Exposure</th><th>Actions</th></tr></thead>
        <tbody>
          ${repositories().map(r => `
            <tr class="expandable-row" data-repo-id="${r.id}">
              <td><strong>${r.name}</strong><div style="font-size:11px;color:var(--text-secondary);">${r.language} · ${r.branch}</div></td>
              <td>${r.lastScan}</td>
              <td><div class="risk-badge ${r.riskScore >= 80 ? 'risk-critical' : r.riskScore >= 60 ? 'risk-high' : r.riskScore >= 40 ? 'risk-medium' : 'risk-low'}" style="width:36px;height:36px;font-size:12px;">${r.riskScore}</div></td>
              <td>${r.findings}</td>
              <td><span class="severity-tag severity-${r.exposure.toLowerCase()}">${r.exposure}</span></td>
              <td><button class="btn btn-outline btn-sm" onclick="event.stopPropagation()">Scan</button></td>
            </tr>
            <tr><td colspan="6"><div class="expanded-content" id="repo-detail-${r.id}">
              <div class="expanded-grid">
                <div>
                  <h4 style="font-size:14px;margin-bottom:var(--space-3);">CBOM Breakdown</h4>
                  <div style="display:flex;flex-direction:column;gap:8px;">
                    <div style="display:flex;justify-content:space-between;font-size:13px;"><span>AES-256-GCM</span><span style="color:var(--success);">Secure</span></div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;"><span>SHA-256</span><span style="color:var(--success);">Secure</span></div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;"><span>MD5</span><span style="color:var(--danger);">Deprecated</span></div>
                  </div>
                </div>
                <div>
                  <h4 style="font-size:14px;margin-bottom:var(--space-3);">Key Length Distribution</h4>
                  <div style="display:flex;flex-direction:column;gap:6px;">
                    <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;"><span>4096-bit</span><span>32%</span></div><div class="progress-bar"><div class="fill" style="width:32%;background:var(--success);"></div></div></div>
                    <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;"><span>2048-bit</span><span>48%</span></div><div class="progress-bar"><div class="fill" style="width:48%;background:var(--accent);"></div></div></div>
                    <div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;"><span>1024-bit</span><span>20%</span></div><div class="progress-bar"><div class="fill" style="width:20%;background:var(--danger);"></div></div></div>
                  </div>
                </div>
              </div>
            </div></td></tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderFindings() {
  return `
    <div class="page-header"><h1>Findings</h1>
      <div style="display:flex;gap:var(--space-3);">
        <select class="filter-select"><option>All Severities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
        <select class="filter-select"><option>All Status</option><option>Open</option><option>In Review</option><option>Resolved</option></select>
      </div>
    </div>
    <div class="card card-flat" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead><tr><th>Severity</th><th>File</th><th>Algorithm</th><th>Risk</th><th>Impact</th><th>Status</th><th>Assigned To</th></tr></thead>
        <tbody>
          ${findings().map(f => `
            <tr class="expandable-row" data-finding-id="${f.id}">
              <td><span class="severity-tag severity-${f.severity.toLowerCase()}">${f.severity}</span></td>
              <td><code style="font-size:12px;color:var(--accent);">${f.file}</code></td>
              <td>${f.algorithm}</td>
              <td><div class="risk-badge ${f.riskScore >= 80 ? 'risk-critical' : f.riskScore >= 60 ? 'risk-high' : f.riskScore >= 40 ? 'risk-medium' : 'risk-low'}" style="width:32px;height:32px;font-size:11px;">${f.riskScore}</div></td>
              <td>${f.impact}</td>
              <td><span class="pill ${f.status === 'Open' ? 'pill-danger' : f.status === 'In Review' ? 'pill-warning' : 'pill-success'}">${f.status}</span></td>
              <td>${f.assignee}</td>
            </tr>
            <tr><td colspan="7"><div class="expanded-content" id="finding-detail-${f.id}">
              <div class="expanded-grid">
                <div>
                  <div style="margin-bottom:var(--space-4);">
                    <div style="font-size:12px;font-weight:600;margin-bottom:6px;color:var(--danger);">❌ Vulnerable Code</div>
                    <div class="code-block vulnerable"><pre>${f.code}</pre></div>
                  </div>
                  <div>
                    <div style="font-size:12px;font-weight:600;margin-bottom:6px;color:var(--success);">✅ Recommended Fix</div>
                    <div class="code-block secure"><pre>${f.fix}</pre></div>
                  </div>
                </div>
                <div>
                  <div style="background:var(--bg-card);border-radius:var(--radius-md);padding:var(--space-4);border:1px solid var(--border);margin-bottom:var(--space-4);">
                    <div style="font-size:12px;font-weight:600;margin-bottom:8px;">🤖 AI Explanation</div>
                    <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${f.explanation}</p>
                  </div>
                  <div style="font-size:12px;font-weight:600;margin-bottom:8px;">Compliance Mapping</div>
                  <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    ${f.compliance.map(c => `<span class="pill pill-purple">${c}</span>`).join('')}
                  </div>
                </div>
              </div>
            </div></td></tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderRemediation() {
  const remFindings = findings().filter(f => f.status !== 'Resolved').slice(0, 4);
  return `
    <div class="page-header"><h1>Remediation Center</h1></div>
    ${remFindings.map(f => `
      <div class="remediation-item">
        <div class="remediation-header">
          <div>
            <span class="severity-tag severity-${f.severity.toLowerCase()}" style="margin-right:8px;">${f.severity}</span>
            <strong>${f.algorithm}</strong> in <code style="color:var(--accent);">${f.file}</code>
          </div>
          <span class="pill ${f.status === 'Open' ? 'pill-danger' : 'pill-warning'}">${f.status}</span>
        </div>
        <div class="code-compare">
          <div>
            <div class="code-compare-label" style="color:var(--danger);">❌ Vulnerable Code</div>
            <div class="code-block vulnerable"><pre>${f.code}</pre><button class="copy-btn" onclick="navigator.clipboard.writeText('${f.code.replace(/'/g, "\\'")}')">Copy</button></div>
          </div>
          <div>
            <div class="code-compare-label" style="color:var(--success);">✅ Secure Replacement</div>
            <div class="code-block secure"><pre>${f.fix}</pre><button class="copy-btn" onclick="navigator.clipboard.writeText('${f.fix.replace(/'/g, "\\'")}')">Copy Fix</button></div>
          </div>
        </div>
        <div style="background:var(--bg-page);border-radius:var(--radius-md);padding:var(--space-4);margin-bottom:var(--space-5);">
          <div style="font-size:12px;font-weight:600;margin-bottom:6px;">🤖 Explanation</div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${f.explanation}</p>
        </div>
        <div class="remediation-actions">
          <button class="btn btn-primary btn-sm">Copy Fix</button>
          <button class="btn btn-outline btn-sm">Create PR</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--success);border-color:var(--success);">Mark as Resolved</button>
        </div>
      </div>
    `).join('')}`;
}

function renderCompliance() {
  const c = complianceData;
  function gaugeHTML(data, color) {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (data.score / data.total) * circumference;
    return `<div class="compliance-card">
      <div class="gauge"><svg viewBox="0 0 100 100" width="120" height="120"><circle class="track" cx="50" cy="50" r="45"/><circle class="fill-ring" cx="50" cy="50" r="45" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/></svg><div class="value">${data.score}%</div></div>
      <h4>${data.label}</h4>
      <div class="score">${data.score} / ${data.total} controls</div>
    </div>`;
  }
  return `
    <div class="page-header"><h1>Compliance Dashboard</h1>
      <div style="display:flex;gap:var(--space-3);">
        <button class="btn btn-outline btn-sm">📄 Export PDF</button>
        <button class="btn btn-outline btn-sm">📊 Export CSV</button>
      </div>
    </div>
    <div class="compliance-grid">
      ${gaugeHTML(c.owasp, 'var(--accent)')}
      ${gaugeHTML(c.nist, 'var(--success)')}
      ${gaugeHTML(c.pci, 'var(--warning)')}
      <div class="compliance-card">
        <div class="gauge"><svg viewBox="0 0 100 100" width="120" height="120"><circle class="track" cx="50" cy="50" r="45"/><circle class="fill-ring" cx="50" cy="50" r="45" stroke="var(--purple-mid)" stroke-dasharray="${2 * Math.PI * 45}" stroke-dashoffset="${2 * Math.PI * 45 - (c.auditReadiness / 100) * 2 * Math.PI * 45}"/></svg><div class="value">${c.auditReadiness}%</div></div>
        <h4>Audit Readiness</h4>
        <div class="score">Overall compliance posture</div>
      </div>
    </div>
    <div class="chart-card">
      <h3>Control Coverage by Framework</h3>
      <div style="display:flex;flex-direction:column;gap:var(--space-5);padding:var(--space-4) 0;">
        <div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>OWASP Top 10 Coverage</span><span style="font-weight:600;">${c.owasp.score}%</span></div><div class="progress-bar" style="height:12px;"><div class="fill" style="width:${c.owasp.score}%;"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>NIST SP 800-131A Mapping</span><span style="font-weight:600;">${c.nist.score}%</span></div><div class="progress-bar" style="height:12px;"><div class="fill" style="width:${c.nist.score}%;background:var(--success);"></div></div></div>
        <div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>PCI-DSS Control Coverage</span><span style="font-weight:600;">${c.pci.score}%</span></div><div class="progress-bar" style="height:12px;"><div class="fill" style="width:${c.pci.score}%;background:var(--warning);"></div></div></div>
      </div>
    </div>`;
}

function renderRisk() {
  const exposureLevels = ['None', 'Internal', 'Limited', 'Broad', 'Public'];
  const strengthLevels = ['Broken', 'Weak', 'Fair', 'Good', 'Strong'];
  const heatColors = [
    ['#1A7A4A', '#1A7A4A', '#52C41A', '#52C41A', '#52C41A'],
    ['#1A7A4A', '#52C41A', '#D4821A', '#D4821A', '#52C41A'],
    ['#D4821A', '#D4821A', '#D4821A', '#FF8C00', '#D4821A'],
    ['#C0392B', '#C0392B', '#D4821A', '#D4821A', '#FF8C00'],
    ['#C0392B', '#C0392B', '#C0392B', '#C0392B', '#D4821A'],
  ];
  const cellCounts = [
    [0, 0, 1, 2, 5], [0, 1, 3, 4, 8], [2, 3, 6, 4, 3], [4, 7, 5, 2, 1], [8, 6, 3, 1, 0]
  ];
  return `
    <div class="page-header"><h1>Risk Prioritization</h1>
      <div style="display:flex;gap:var(--space-3);">
        <button class="btn btn-outline btn-sm">Sort by Business Impact</button>
        <button class="btn btn-outline btn-sm">Sort by Exploitability</button>
      </div>
    </div>
    <div class="heatmap-container">
      <div class="heatmap-header"><h3>Risk Heatmap — Exposure × Algorithm Strength</h3></div>
      <div class="heatmap-wrapper">
        <div class="heatmap-y-labels">${strengthLevels.map(l => `<div>${l}</div>`).join('')}</div>
        <div>
          <div class="heatmap-grid">
            ${heatColors.map((row, ri) => row.map((color, ci) => `<div class="heatmap-cell" style="background:${color};opacity:${cellCounts[ri][ci] > 0 ? 0.4 + cellCounts[ri][ci] * 0.07 : 0.15};">${cellCounts[ri][ci] || ''}</div>`).join('')).join('')}
          </div>
          <div class="heatmap-x-labels">${exposureLevels.map(l => `<div>${l}</div>`).join('')}</div>
        </div>
      </div>
    </div>
    <div class="card card-flat" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead><tr><th>Finding</th><th>Algorithm</th><th>Exposure</th><th>Business Impact</th><th>Exploitability</th><th>Risk</th></tr></thead>
        <tbody>
          ${findings().slice(0, 5).map(f => `<tr>
            <td><code style="font-size:12px;color:var(--accent);">${f.file}</code></td>
            <td>${f.algorithm}</td>
            <td>${f.severity}</td>
            <td>${f.impact}</td>
            <td><div class="progress-bar" style="width:80px;"><div class="fill" style="width:${f.riskScore}%;background:${f.riskScore >= 80 ? 'var(--danger)' : f.riskScore >= 60 ? 'var(--warning)' : 'var(--success)'};"></div></div></td>
            <td><div class="risk-badge ${f.riskScore >= 80 ? 'risk-critical' : f.riskScore >= 60 ? 'risk-high' : 'risk-medium'}" style="width:32px;height:32px;font-size:11px;">${f.riskScore}</div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderIntegrations() {
  return `
    <div class="page-header"><h1>Integrations</h1><button class="btn btn-primary btn-sm">+ Connect</button></div>
    <div class="integration-grid">
      ${integrations.map(i => `
        <div class="integration-card">
          <div class="integration-icon">${i.icon}</div>
          <h3>${i.name}</h3>
          <div class="integration-meta">
            <div><span class="status-dot ${i.connected ? (i.health === 'Warning' ? 'warning' : 'connected') : 'disconnected'}"></span>${i.connected ? 'Connected' : 'Not connected'}</div>
            <div>Last sync: ${i.lastSync}</div>
            <div>Webhook: ${i.health}</div>
          </div>
          <button class="btn ${i.connected ? 'btn-outline' : 'btn-primary'} btn-sm" style="margin-top:var(--space-4);width:100%;">${i.connected ? 'Configure' : 'Connect'}</button>
        </div>
      `).join('')}
    </div>`;
}

function renderBilling() {
  const b = billingData;
  return `
    <div class="page-header"><h1>Billing</h1><button class="btn btn-primary btn-sm">Upgrade Plan</button></div>
    <div class="billing-grid">
      <div class="stat-card"><div class="stat-label">Current Plan</div><div class="stat-value" style="color:var(--accent)">${b.plan}</div><div style="font-size:13px;color:var(--text-secondary);margin-top:var(--space-2);">${b.price} · Renews ${b.renewDate}</div></div>
      <div class="stat-card"><div class="stat-label">AI Token Usage</div><div class="stat-value">${(b.aiTokens.used / 1000).toFixed(1)}k<span style="font-size:14px;font-weight:400;color:var(--text-secondary);"> / ${(b.aiTokens.total / 1000)}k</span></div><div class="progress-bar" style="margin-top:var(--space-3);"><div class="fill" style="width:${(b.aiTokens.used / b.aiTokens.total) * 100}%;"></div></div></div>
    </div>
    <div class="billing-grid">
      <div class="stat-card"><div class="stat-label">Repositories</div><div class="stat-value">${b.repos.used}<span style="font-size:14px;font-weight:400;color:var(--text-secondary);"> / Unlimited</span></div></div>
      <div class="stat-card"><div class="stat-label">Next Invoice</div><div class="stat-value">$149</div><div style="font-size:13px;color:var(--text-secondary);margin-top:var(--space-2);">Due March 15, 2026</div></div>
    </div>
    <div class="chart-card">
      <h3>Invoice History</h3>
      <table class="data-table">
        <thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>${b.invoices.map(inv => `<tr><td>${inv.id}</td><td>${inv.date}</td><td>${inv.amount}</td><td><span class="pill pill-success">${inv.status}</span></td></tr>`).join('')}</tbody>
      </table>
    </div>`;
}

function renderSettings() {
  return `
    <div class="page-header"><h1>Settings</h1></div>
    <div class="tabs" id="settingsTabs">
      <div class="tab active" data-tab="org">Organization</div>
      <div class="tab" data-tab="members">Members & Roles</div>
      <div class="tab" data-tab="api">API Keys</div>
      <div class="tab" data-tab="security">Security</div>
      <div class="tab" data-tab="notifications">Notifications</div>
      <div class="tab" data-tab="retention">Data Retention</div>
    </div>
    <div class="settings-content" id="settingsContent">
      <div class="settings-group">
        <h3>Organization Settings</h3>
        <div class="settings-row"><div><div class="label">Organization Name</div><div class="description">This is your team's visible name</div></div><div class="input-field" style="width:240px;display:flex;align-items:center;padding:0 12px;font-size:14px;">FinTech Corp</div></div>
        <div class="settings-row"><div><div class="label">Organization Slug</div><div class="description">Used in URLs and API calls</div></div><div style="font-size:14px;color:var(--text-secondary);font-family:var(--font-mono);">fintechcorp</div></div>
        <div class="settings-row"><div><div class="label">Default Branch</div><div class="description">Branch to scan by default</div></div><div style="font-size:14px;">main</div></div>
        <div class="settings-row"><div><div class="label">Auto-scan on Push</div><div class="description">Automatically scan repos when code is pushed</div></div><div class="toggle-control active" onclick="this.classList.toggle('active')"></div></div>
        <div class="settings-row"><div><div class="label">Email Notifications</div><div class="description">Receive email alerts for critical findings</div></div><div class="toggle-control active" onclick="this.classList.toggle('active')"></div></div>
        <div class="settings-row"><div><div class="label">Session Timeout</div><div class="description">Auto-logout after inactivity</div></div><div style="font-size:14px;">30 minutes</div></div>
      </div>
    </div>`;
}

function renderAuditLogs() {
  return `
    <div class="page-header"><h1>Audit Logs</h1>
      <div style="display:flex;gap:var(--space-3);">
        <select class="filter-select"><option>All Users</option><option>sarah.chen@fintechcorp.com</option><option>marcus.webb@healthdata.com</option></select>
        <select class="filter-select"><option>All Actions</option><option>Scan</option><option>Export</option><option>Resolve</option></select>
        <button class="btn btn-outline btn-sm">📊 Export</button>
      </div>
    </div>
    <div class="card card-flat" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Target</th><th>IP Address</th></tr></thead>
        <tbody>${auditLogs.map(l => `<tr>
          <td style="white-space:nowrap;font-size:13px;color:var(--text-secondary);">${l.time}</td>
          <td><code style="font-size:12px;">${l.user}</code></td>
          <td>${l.action}</td>
          <td style="font-size:13px;">${l.target}</td>
          <td style="font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${l.ip}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
}

// ==================== ROUTE MAPPING ====================

function getSubPage(route) {
  const page = route.replace('/dashboard', '') || '/dashboard';
  const subRoute = '/' + (route.split('/')[1] || 'dashboard');
  switch (subRoute) {
    case '/dashboard': return renderMainDashboard();
    case '/repositories': return renderRepositories();
    case '/findings': return renderFindings();
    case '/risk': return renderRisk();
    case '/remediation': return renderRemediation();
    case '/compliance': return renderCompliance();
    case '/integrations': return renderIntegrations();
    case '/billing': return renderBilling();
    case '/settings': return renderSettings();
    case '/audit-logs': return renderAuditLogs();
    default: return renderMainDashboard();
  }
}

export async function renderDashboard(appEl, route) {
  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    window.location.hash = '/login';
    return;
  }

  // Show cached/mock data immediately for instant render
  appEl.innerHTML = `
    <div class="dashboard-layout" id="dashboardLayout">
      ${renderSidebar(route)}
      ${renderTopbar()}
      <main class="dashboard-content" id="dashboardContent">
        ${getSubPage(route)}
      </main>
    </div>
  `;

  // Attach UI interactions
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      document.getElementById('dashboardLayout').classList.toggle('sidebar-collapsed');
    });
  }

  document.querySelectorAll('.expandable-row').forEach(row => {
    row.addEventListener('click', () => {
      const repoId = row.dataset.repoId;
      const findingId = row.dataset.findingId;
      const detail = document.getElementById(repoId ? `repo-detail-${repoId}` : `finding-detail-${findingId}`);
      if (detail) detail.classList.toggle('show');
    });
  });

  const tabs = document.querySelectorAll('#settingsTabs .tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Fetch live data in background and refresh content if page changed
  try {
    const subRoute = '/' + (route.split('/')[1] || 'dashboard');
    const promises = [];

    if (subRoute === '/dashboard') {
      promises.push(
        getDashboardStats().then(r => { liveStats = { ...mockStats, ...r.data }; }).catch(() => { }),
        getRepos().then(r => { if (r.data?.repos) liveRepos = r.data.repos; }).catch(() => { }),
      );
    } else if (subRoute === '/repositories') {
      promises.push(
        getRepos().then(r => { if (r.data?.repos) liveRepos = r.data.repos; }).catch(() => { }),
      );
    } else if (subRoute === '/findings' || subRoute === '/remediation' || subRoute === '/risk') {
      promises.push(
        getFindings().then(r => { if (r.data?.findings) liveFindings = r.data.findings; }).catch(() => { }),
      );
    }

    if (promises.length) {
      await Promise.all(promises);
      // Re-render the main content with live data (only if user is still on same page)
      const content = document.getElementById('dashboardContent');
      if (content) content.innerHTML = getSubPage(route);

      // Re-attach expandable row listeners
      document.querySelectorAll('.expandable-row').forEach(row => {
        row.addEventListener('click', () => {
          const repoId = row.dataset.repoId;
          const findingId = row.dataset.findingId;
          const detail = document.getElementById(repoId ? `repo-detail-${repoId}` : `finding-detail-${findingId}`);
          if (detail) detail.classList.toggle('show');
        });
      });
    }
  } catch (_) {
    // Silent failure — mock data already rendered
  }
}

