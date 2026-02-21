/* =============================================
   CipherX — API Client
   Connects the frontend to the backend via
   the Vite proxy → API Gateway (port 3000)
   ============================================= */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// ---- Token Helpers ----
export function getToken() {
    return localStorage.getItem('cipherx_token');
}

export function setToken(token) {
    localStorage.setItem('cipherx_token', token);
}

export function clearToken() {
    localStorage.removeItem('cipherx_token');
    localStorage.removeItem('cipherx_user');
}

export function setUser(user) {
    localStorage.setItem('cipherx_user', JSON.stringify(user));
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem('cipherx_user') || 'null');
    } catch {
        return null;
    }
}

export function isAuthenticated() {
    return !!getToken();
}

// ---- Core Fetch Wrapper ----
async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const data = await res.json();

    if (!res.ok) {
        const msg = data?.error?.message || `Request failed (${res.status})`;
        throw new Error(msg);
    }

    return data;
}

// ===================================================
// AUTH API
// ===================================================

/** Sign up a new user.
 *  POST /api/v1/auth/register
 *  @param {string} name
 *  @param {string} email
 *  @param {string} password
 *  @param {string} orgName  - company/org name
 */
export async function signup({ fullName, email, password, orgName }) {
    const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password, orgName }),
    });
    if (data.data?.token) setToken(data.data.token);
    else if (data.data?.tokens?.accessToken) setToken(data.data.tokens.accessToken);
    if (data.data?.user) setUser(data.data.user);
    return data;
}

/** Log in an existing user.
 *  POST /api/v1/auth/login
 */
export async function login({ email, password }) {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    if (data.data?.token) setToken(data.data.token);
    else if (data.data?.tokens?.accessToken) setToken(data.data.tokens.accessToken);
    if (data.data?.user) setUser(data.data.user);
    return data;
}

/** Request a password-reset link.
 *  POST /api/v1/auth/forgot-password
 */
export async function forgotPassword({ email }) {
    return apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

/** Reset password with token from email link.
 *  POST /api/v1/auth/reset-password
 */
export async function resetPassword({ token, password }) {
    return apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
    });
}

/** Log out — clears local token. */
export function logout() {
    clearToken();
}

// ===================================================
// DASHBOARD API
// ===================================================

/** Get aggregated dashboard stats.
 *  GET /api/v1/dashboard/stats
 */
export async function getDashboardStats() {
    return apiFetch('/dashboard/stats');
}

// ===================================================
// REPOSITORIES API
// ===================================================

/** List all repositories for the org.
 *  GET /api/v1/repos
 */
export async function getRepos(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/repos${qs ? '?' + qs : ''}`);
}

/** Get a single repository by ID.
 *  GET /api/v1/repos/:id
 */
export async function getRepo(repoId) {
    return apiFetch(`/repos/${repoId}`);
}

/** Trigger a scan on a repository.
 *  POST /api/v1/scan
 */
export async function triggerScan(repoId, scanType = 'full') {
    return apiFetch('/scan', {
        method: 'POST',
        body: JSON.stringify({ repoId, scanType }),
    });
}

// ===================================================
// FINDINGS API
// ===================================================

/** List findings (optionally filtered).
 *  GET /api/v1/findings
 */
export async function getFindings(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/findings${qs ? '?' + qs : ''}`);
}

/** Get a single finding.
 *  GET /api/v1/findings/:id
 */
export async function getFinding(findingId) {
    return apiFetch(`/findings/${findingId}`);
}

// ===================================================
// COMPLIANCE API
// ===================================================

/** Get compliance status.
 *  GET /api/v1/compliance
 */
export async function getCompliance(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/compliance${qs ? '?' + qs : ''}`);
}

// ===================================================
// REMEDIATION API
// ===================================================

/** Generate an AI fix for a finding.
 *  POST /api/v1/ai/remediate
 */
export async function generateRemediation(findingId) {
    return apiFetch('/ai/remediate', {
        method: 'POST',
        body: JSON.stringify({ findingId }),
    });
}
