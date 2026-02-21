/* =============================================
   CipherX — Main Entry Point
   ============================================= */
import './styles/tokens.css';
import './styles/reset.css';
import './styles/components.css';
import './styles/landing.css';
import './styles/auth.css';
import './styles/dashboard.css';

import { registerRoute, initRouter } from './router.js';
import { renderLanding } from './pages/landing.js';
import { renderAuth } from './pages/auth.js';
import { renderDashboard } from './pages/dashboard.js';

// ---- Register Routes ----
registerRoute('/', (appEl) => renderLanding(appEl));

// Auth routes
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];
authRoutes.forEach(route => {
  registerRoute(route, (appEl) => renderAuth(appEl, route));
});

// Dashboard routes
const dashboardRoutes = [
  '/dashboard', '/repositories', '/findings', '/risk',
  '/remediation', '/compliance', '/integrations',
  '/billing', '/settings', '/audit-logs'
];
dashboardRoutes.forEach(route => {
  registerRoute(route, (appEl, currentPath) => renderDashboard(appEl, currentPath));
});

// ---- Init ----
const app = document.getElementById('app');
initRouter(app);
