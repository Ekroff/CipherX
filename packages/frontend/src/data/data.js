/* =============================================
   Mock Data for CipherX
   ============================================= */

export const repositories = [
  { id: 1, name: 'payment-gateway', lastScan: '2 hours ago', riskScore: 87, findings: 23, exposure: 'Critical', language: 'Java', branch: 'main' },
  { id: 2, name: 'auth-service', lastScan: '4 hours ago', riskScore: 72, findings: 15, exposure: 'High', language: 'Go', branch: 'main' },
  { id: 3, name: 'user-api', lastScan: '1 day ago', riskScore: 45, findings: 8, exposure: 'Medium', language: 'Python', branch: 'develop' },
  { id: 4, name: 'notification-svc', lastScan: '3 hours ago', riskScore: 31, findings: 4, exposure: 'Low', language: 'Node.js', branch: 'main' },
  { id: 5, name: 'data-pipeline', lastScan: '6 hours ago', riskScore: 68, findings: 19, exposure: 'High', language: 'Python', branch: 'main' },
  { id: 6, name: 'mobile-backend', lastScan: '12 hours ago', riskScore: 54, findings: 11, exposure: 'Medium', language: 'Kotlin', branch: 'release' },
  { id: 7, name: 'infra-config', lastScan: '1 hour ago', riskScore: 92, findings: 31, exposure: 'Critical', language: 'Terraform', branch: 'main' },
  { id: 8, name: 'web-frontend', lastScan: '5 hours ago', riskScore: 22, findings: 3, exposure: 'Low', language: 'TypeScript', branch: 'main' },
];

export const findings = [
  { id: 1, severity: 'Critical', file: 'src/crypto/encrypt.java', algorithm: 'MD5', riskScore: 95, impact: 'Data Breach', status: 'Open', assignee: 'Sarah Chen', repo: 'payment-gateway', code: 'MessageDigest md = MessageDigest.getInstance("MD5");', fix: 'MessageDigest md = MessageDigest.getInstance("SHA-256");', explanation: 'MD5 is cryptographically broken and unsuitable for further use. It is susceptible to collision attacks and should be replaced with SHA-256 or SHA-3.', compliance: ['OWASP A02', 'NIST SP 800-131A', 'PCI-DSS 3.6'] },
  { id: 2, severity: 'Critical', file: 'config/secrets.yml', algorithm: 'Hardcoded Key', riskScore: 98, impact: 'Key Exposure', status: 'Open', assignee: 'Marcus Webb', repo: 'infra-config', code: 'api_key: "sk-live-a8f3k2j5h6g7d8s9"', fix: 'api_key: ${VAULT_API_KEY}', explanation: 'Hardcoded API keys in configuration files can be extracted by anyone with repository access. Use environment variables or a secrets manager.', compliance: ['OWASP A07', 'PCI-DSS 3.4'] },
  { id: 3, severity: 'High', file: 'lib/auth/token.go', algorithm: 'SHA-1', riskScore: 78, impact: 'Token Forgery', status: 'In Review', assignee: 'Priya Sharma', repo: 'auth-service', code: 'h := sha1.New()', fix: 'h := sha256.New()', explanation: 'SHA-1 has known collision vulnerabilities. HMAC-SHA1 is still considered safe, but for new implementations, SHA-256 is strongly recommended.', compliance: ['NIST SP 800-131A'] },
  { id: 4, severity: 'High', file: 'src/tls/config.py', algorithm: 'TLS 1.0', riskScore: 82, impact: 'MITM Attack', status: 'Open', assignee: 'Sarah Chen', repo: 'data-pipeline', code: 'ssl.PROTOCOL_TLSv1', fix: 'ssl.PROTOCOL_TLSv1_2', explanation: 'TLS 1.0 is deprecated. Multiple known vulnerabilities (BEAST, POODLE) make it unsuitable. Upgrade to TLS 1.2 or 1.3.', compliance: ['PCI-DSS 3.2.1', 'NIST SP 800-52'] },
  { id: 5, severity: 'Medium', file: 'src/utils/hash.py', algorithm: 'DES', riskScore: 65, impact: 'Weak Cipher', status: 'Open', assignee: 'Unassigned', repo: 'user-api', code: 'cipher = DES.new(key, DES.MODE_ECB)', fix: 'cipher = AES.new(key, AES.MODE_GCM)', explanation: 'DES uses a 56-bit key which can be brute-forced. ECB mode is also deterministic. Use AES-256-GCM.', compliance: ['OWASP A02', 'NIST SP 800-131A'] },
  { id: 6, severity: 'Medium', file: 'src/crypto/rsa.java', algorithm: 'RSA-1024', riskScore: 60, impact: 'Key Weakness', status: 'In Review', assignee: 'Marcus Webb', repo: 'payment-gateway', code: 'KeyPairGenerator.getInstance("RSA").initialize(1024)', fix: 'KeyPairGenerator.getInstance("RSA").initialize(4096)', explanation: 'RSA-1024 is considered insecure by NIST since 2013. Use at minimum RSA-2048, prefer RSA-4096.', compliance: ['NIST SP 800-131A'] },
  { id: 7, severity: 'Low', file: 'test/helpers.js', algorithm: 'Math.random()', riskScore: 30, impact: 'Weak RNG', status: 'Open', assignee: 'Unassigned', repo: 'web-frontend', code: 'const token = Math.random().toString(36)', fix: 'const token = crypto.randomUUID()', explanation: 'Math.random() is not cryptographically secure. Use the Web Crypto API for generating tokens.', compliance: ['OWASP A02'] },
  { id: 8, severity: 'Low', file: 'src/utils/cert.kt', algorithm: 'Self-signed Cert', riskScore: 25, impact: 'Trust Chain', status: 'Resolved', assignee: 'Priya Sharma', repo: 'mobile-backend', code: 'trustAllCerts = true', fix: 'trustAllCerts = false // Use CA-signed cert', explanation: 'Disabling certificate validation opens the application to man-in-the-middle attacks.', compliance: ['OWASP A07'] },
];

export const complianceData = {
  owasp: { score: 78, total: 100, label: 'OWASP Top 10' },
  nist: { score: 91, total: 100, label: 'NIST SP 800-131A' },
  pci: { score: 65, total: 100, label: 'PCI-DSS' },
  auditReadiness: 74,
};

export const pricingPlans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    subtitle: 'For small security teams',
    features: ['Up to 10 repos', 'CBOM Inventory', 'Basic Reporting', 'GitHub Integration'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$149',
    period: '/mo',
    subtitle: 'For growing security programs',
    features: ['Unlimited repos', 'Full CBOM', 'CI/CD Integration', 'Guided Remediation', 'Compliance Reports', 'Priority Support'],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    subtitle: 'For large organizations',
    features: ['Everything in Pro', 'SSO Integration', 'Dedicated CSM', 'Custom Integrations', 'SLA & On-prem', 'Custom Compliance'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export const testimonials = [
  { quote: 'CipherX found 47 hardcoded keys our SAST scanner completely missed. The guided fix feature alone saved our team weeks of research.', name: 'Sarah Chen', role: 'Head of AppSec, FinTech Corp', stars: 5 },
  { quote: "We went from zero cryptographic visibility to a full CBOM in 48 hours. Compliance reporting used to take us 2 weeks — now it's one click.", name: 'Marcus Webb', role: 'CISO, HealthData Inc', stars: 5 },
  { quote: 'The CI/CD integration is seamless. Our developers now get the exact fix right in the pull request. Zero friction, maximum security.', name: 'Priya Sharma', role: 'Platform Security Lead, CloudScale', stars: 5 },
];

export const integrations = [
  { name: 'GitHub', icon: '🐙', connected: true, lastSync: '2 min ago', health: 'Healthy' },
  { name: 'GitLab', icon: '🦊', connected: true, lastSync: '5 min ago', health: 'Healthy' },
  { name: 'Bitbucket', icon: '🪣', connected: false, lastSync: 'Never', health: 'Not connected' },
  { name: 'Jenkins', icon: '🔧', connected: true, lastSync: '1 hour ago', health: 'Warning' },
  { name: 'GitHub Actions', icon: '⚡', connected: true, lastSync: '3 min ago', health: 'Healthy' },
  { name: 'CircleCI', icon: '🔄', connected: false, lastSync: 'Never', health: 'Not connected' },
];

export const billingData = {
  plan: 'Pro',
  price: '$149/mo',
  renewDate: 'Mar 15, 2026',
  aiTokens: { used: 7420, total: 10000 },
  repos: { used: 8, total: 999 },
  invoices: [
    { id: 'INV-2026-002', date: 'Feb 1, 2026', amount: '$149.00', status: 'Paid' },
    { id: 'INV-2026-001', date: 'Jan 1, 2026', amount: '$149.00', status: 'Paid' },
    { id: 'INV-2025-012', date: 'Dec 1, 2025', amount: '$149.00', status: 'Paid' },
  ],
};

export const auditLogs = [
  { time: '2 min ago', user: 'sarah.chen@fintechcorp.com', action: 'Triggered scan', target: 'payment-gateway', ip: '192.168.1.42' },
  { time: '15 min ago', user: 'marcus.webb@healthdata.com', action: 'Exported compliance report', target: 'NIST SP 800-131A', ip: '10.0.0.15' },
  { time: '1 hour ago', user: 'priya.sharma@cloudscale.io', action: 'Resolved finding', target: 'F-0023 (SHA-1 in auth-service)', ip: '172.16.0.8' },
  { time: '2 hours ago', user: 'admin@company.com', action: 'Added team member', target: 'dev-team@company.com', ip: '192.168.1.1' },
  { time: '3 hours ago', user: 'sarah.chen@fintechcorp.com', action: 'Connected integration', target: 'Jenkins CI', ip: '192.168.1.42' },
  { time: '5 hours ago', user: 'system', action: 'Automated scan completed', target: 'All repositories (8)', ip: '—' },
  { time: '6 hours ago', user: 'marcus.webb@healthdata.com', action: 'Updated API key', target: 'Production key rotated', ip: '10.0.0.15' },
  { time: '1 day ago', user: 'admin@company.com', action: 'Updated org settings', target: 'Data retention: 90 days', ip: '192.168.1.1' },
];

export const dashboardStats = {
  riskScore: 72,
  totalFindings: 114,
  criticalIssues: 12,
  aiSuggestions: 48,
  resolvedThisWeek: 23,
  trendData: [65, 72, 68, 80, 75, 82, 88, 92, 87, 78, 72, 68, 75, 82, 88, 85, 79, 74, 68, 72, 78, 82, 76, 70, 68, 72, 78, 82, 85, 72],
};
