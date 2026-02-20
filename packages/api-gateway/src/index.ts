// ============================================
// CipherX – Unified API Gateway
// ============================================
// Single entry point for all API requests. Routes to microservices,
// handles JWT validation, rate limiting, CORS, audit logging.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { errorResponse, JwtPayload, getPool } from '@cipherx/common';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Service URLs
const SERVICES = {
    auth: `http://localhost:${process.env.AUTH_SERVICE_PORT || 3001}`,
    scanner: `http://localhost:${process.env.SCANNER_SERVICE_PORT || 3002}`,
    riskEngine: `http://localhost:${process.env.RISK_ENGINE_PORT || 3003}`,
    remediation: `http://localhost:${process.env.REMEDIATION_SERVICE_PORT || 3004}`,
    gatekeeper: `http://localhost:${process.env.GATEKEEPER_SERVICE_PORT || 3005}`,
    compliance: `http://localhost:${process.env.COMPLIANCE_SERVICE_PORT || 3006}`,
};

const pool = getPool();

// --- Security Middleware ---
app.use(helmet({
    contentSecurityPolicy: false, // For frontend proxying
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-Id'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(morgan('combined'));

// Global rate limiting
app.use(rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests.' } },
    standardHeaders: true,
    legacyHeaders: false,
}));

// --- JWT Authentication Middleware ---
function authenticateJWT(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json(errorResponse('AUTH_REQUIRED', 'Authentication required.'));
        return;
    }

    try {
        const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as JwtPayload;
        // Forward user context to downstream services
        req.headers['x-user-id'] = decoded.userId;
        req.headers['x-org-id'] = decoded.orgId;
        req.headers['x-user-email'] = decoded.email;
        req.headers['x-user-role'] = decoded.role;
        (req as any).user = decoded;
        next();
    } catch {
        res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid or expired token.'));
        return;
    }
}

// --- Audit Logging Middleware ---
async function auditLog(req: express.Request, _res: express.Response, next: express.NextFunction) {
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (orgId && req.method !== 'GET') {
        pool.query(
            `INSERT INTO audit_logs (org_id, user_id, action, resource_type, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                orgId, userId || null,
                `${req.method} ${req.path}`,
                'api',
                req.ip,
                req.headers['user-agent'],
                JSON.stringify({ query: req.query }),
            ]
        ).catch(err => console.error('Audit log error:', err));
    }
    next();
}

// --- Health Check ---
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'api-gateway',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        services: Object.keys(SERVICES),
    });
});

// --- Public Routes (no auth) ---
app.use('/api/v1/auth', createProxyMiddleware({
    target: SERVICES.auth,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/auth': '/auth' },
}));

// Webhook routes (authenticated by webhook secret, not JWT)
app.use('/api/v1/integrations/github', createProxyMiddleware({
    target: SERVICES.gatekeeper,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/integrations/github': '/gatekeeper/webhooks/github' },
}));

app.use('/api/v1/integrations/gitlab', createProxyMiddleware({
    target: SERVICES.gatekeeper,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/integrations/gitlab': '/gatekeeper/webhooks/gitlab' },
}));

// --- Protected Routes (require JWT) ---
app.use('/api/v1/repos', authenticateJWT, auditLog, createProxyMiddleware({
    target: SERVICES.scanner,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/repos': '/scanner/repos' },
}));

app.use('/api/v1/scan', authenticateJWT, auditLog, createProxyMiddleware({
    target: SERVICES.scanner,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/scan': '/scanner/scan' },
}));

app.use('/api/v1/findings', authenticateJWT, auditLog, createProxyMiddleware({
    target: SERVICES.scanner,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/findings': '/scanner/findings' },
}));

app.use('/api/v1/ai/risk', authenticateJWT, auditLog, createProxyMiddleware({
    target: SERVICES.riskEngine,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/ai/risk': '/risk/analyze' },
}));

app.use('/api/v1/ai/remediate', authenticateJWT, auditLog, createProxyMiddleware({
    target: SERVICES.remediation,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/ai/remediate': '/remediation/generate' },
}));

app.use('/api/v1/compliance', authenticateJWT, auditLog, createProxyMiddleware({
    target: SERVICES.compliance,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/compliance': '/compliance' },
}));

app.use('/api/v1/gatekeeper', authenticateJWT, auditLog, createProxyMiddleware({
    target: SERVICES.gatekeeper,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/gatekeeper': '/gatekeeper' },
}));

// --- Dashboard Stats (aggregated) ---
app.get('/api/v1/dashboard/stats', authenticateJWT, async (req, res) => {
    try {
        const orgId = (req as any).user.orgId;

        const [findings, scans, repos] = await Promise.all([
            pool.query(
                `SELECT severity, COUNT(*) as count FROM findings WHERE org_id = $1 AND status = 'open' GROUP BY severity`,
                [orgId]
            ),
            pool.query(
                `SELECT COUNT(*) as total, MAX(created_at) as last_scan FROM scans WHERE org_id = $1`,
                [orgId]
            ),
            pool.query(
                `SELECT COUNT(*) as total FROM repositories WHERE org_id = $1`,
                [orgId]
            ),
        ]);

        res.json({
            success: true,
            data: {
                findings: findings.rows.reduce((acc: any, r: any) => { acc[r.severity] = parseInt(r.count); return acc; }, {}),
                totalScans: parseInt(scans.rows[0].total),
                lastScan: scans.rows[0].last_scan,
                totalRepos: parseInt(repos.rows[0].total),
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to fetch dashboard stats.'));
    }
});

// --- 404 Handler ---
app.use((_req, res) => {
    res.status(404).json(errorResponse('NOT_FOUND', 'Endpoint not found.'));
});

// --- Start Gateway ---
app.listen(PORT, () => {
    console.log(`\n🚀 CipherX API Gateway running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API:    http://localhost:${PORT}/api/v1/\n`);
    console.log('   Routing to services:');
    Object.entries(SERVICES).forEach(([name, url]) => {
        console.log(`   → ${name}: ${url}`);
    });
    console.log('');
});

export default app;
