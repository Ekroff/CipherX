// ============================================
// CipherX – CI/CD Gatekeeper Service
// ============================================

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { successResponse, errorResponse, SeverityLevel, getPool } from '@cipherx/common';

const pool = getPool();

const router = Router();

// --- Types ---

interface GatekeeperResult {
    shouldBlock: boolean;
    blockReason?: string;
    findings: GatekeeperFinding[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
    };
}

interface GatekeeperFinding {
    file: string;
    line: number;
    severity: string;
    issue: string;
    algorithm?: string;
    remediation?: string;
}

// Blocking thresholds (configurable per org)
const DEFAULT_THRESHOLDS = {
    blockOnCritical: true,
    blockOnHigh: true,
    maxCritical: 0,
    maxHigh: 0,
    maxMedium: 10,
};

// --- GitHub Actions Webhook ---

/**
 * POST /gatekeeper/webhooks/github
 * Handles GitHub webhook events (push, pull_request)
 */
router.post('/webhooks/github', async (req: Request, res: Response) => {
    try {
        // Verify webhook signature
        const signature = req.headers['x-hub-signature-256'] as string;
        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

        if (webhookSecret && signature) {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
            if (signature !== digest) {
                res.status(401).json(errorResponse('INVALID_SIGNATURE', 'Webhook signature verification failed.'));
                return;
            }
        }

        const event = req.headers['x-github-event'] as string;
        const payload = req.body;

        if (event === 'pull_request') {
            const result = await handlePullRequest(payload);
            res.json(successResponse(result));
        } else if (event === 'push') {
            res.json(successResponse({ message: 'Push event received. Scan queued.' }));
        } else {
            res.json(successResponse({ message: `Event ${event} acknowledged.` }));
        }
    } catch (error) {
        console.error('GitHub webhook error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Webhook processing failed.'));
    }
});

/**
 * POST /gatekeeper/webhooks/gitlab
 * Handles GitLab webhook events
 */
router.post('/webhooks/gitlab', async (req: Request, res: Response) => {
    try {
        const gitlabToken = req.headers['x-gitlab-token'] as string;
        if (process.env.GITLAB_WEBHOOK_SECRET && gitlabToken !== process.env.GITLAB_WEBHOOK_SECRET) {
            res.status(401).json(errorResponse('INVALID_TOKEN', 'GitLab webhook token invalid.'));
            return;
        }

        const eventType = req.headers['x-gitlab-event'] as string;
        res.json(successResponse({ message: `GitLab event ${eventType} acknowledged.` }));
    } catch (error) {
        console.error('GitLab webhook error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Webhook processing failed.'));
    }
});

/**
 * POST /gatekeeper/evaluate
 * Evaluate findings against blocking thresholds (used by CI/CD pipelines)
 */
const evaluateSchema = z.object({
    scanId: z.string().uuid(),
    thresholds: z.object({
        blockOnCritical: z.boolean().optional(),
        blockOnHigh: z.boolean().optional(),
        maxCritical: z.number().optional(),
        maxHigh: z.number().optional(),
        maxMedium: z.number().optional(),
    }).optional(),
});

router.post('/evaluate', async (req: Request, res: Response) => {
    try {
        const parsed = evaluateSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input', parsed.error.errors));
            return;
        }

        const { scanId, thresholds: customThresholds } = parsed.data;
        const thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };

        // Get scan findings
        const result = await pool.query(
            `SELECT f.file_path, f.line_number, f.severity, f.detected_issue, f.algorithm,
              r.secure_code as remediation
       FROM findings f
       LEFT JOIN remediations r ON f.id = r.finding_id
       WHERE f.scan_id = $1
       ORDER BY f.severity DESC`,
            [scanId]
        );

        const findings: GatekeeperFinding[] = result.rows.map(row => ({
            file: row.file_path,
            line: row.line_number,
            severity: row.severity,
            issue: row.detected_issue,
            algorithm: row.algorithm,
            remediation: row.remediation,
        }));

        const summary = {
            critical: findings.filter(f => f.severity === 'critical').length,
            high: findings.filter(f => f.severity === 'high').length,
            medium: findings.filter(f => f.severity === 'medium').length,
            low: findings.filter(f => f.severity === 'low').length,
            total: findings.length,
        };

        // Evaluate blocking decision
        let shouldBlock = false;
        let blockReason = '';

        if (thresholds.blockOnCritical && summary.critical > thresholds.maxCritical) {
            shouldBlock = true;
            blockReason = `${summary.critical} critical cryptographic vulnerabilities found (max allowed: ${thresholds.maxCritical}).`;
        } else if (thresholds.blockOnHigh && summary.high > thresholds.maxHigh) {
            shouldBlock = true;
            blockReason = `${summary.high} high-severity cryptographic vulnerabilities found (max allowed: ${thresholds.maxHigh}).`;
        } else if (summary.medium > thresholds.maxMedium) {
            shouldBlock = true;
            blockReason = `${summary.medium} medium-severity vulnerabilities exceed threshold (max: ${thresholds.maxMedium}).`;
        }

        const gatekeeperResult: GatekeeperResult = {
            shouldBlock,
            blockReason: shouldBlock ? blockReason : undefined,
            findings,
            summary,
        };

        // Log decision
        await pool.query(
            `INSERT INTO audit_logs (action, resource_type, resource_id, details)
       VALUES ('gatekeeper.evaluate', 'scan', $1, $2)`,
            [scanId, JSON.stringify({ shouldBlock, blockReason, summary })]
        );

        res.json(successResponse(gatekeeperResult));
    } catch (error) {
        console.error('Evaluate error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Evaluation failed.'));
    }
});

/**
 * GET /gatekeeper/integrations
 * List CI/CD integrations for an org
 */
router.get('/integrations', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).user?.orgId || req.headers['x-org-id'] as string;
        if (!orgId) {
            res.status(401).json(errorResponse('AUTH_REQUIRED', 'Organization context required.'));
            return;
        }

        const result = await pool.query(
            `SELECT ci.*, r.name as repo_name FROM cicd_integrations ci
       JOIN repositories r ON ci.repo_id = r.id
       WHERE ci.org_id = $1 ORDER BY ci.created_at DESC`,
            [orgId]
        );

        res.json(successResponse(result.rows));
    } catch (error) {
        console.error('List integrations error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to list integrations.'));
    }
});

// --- Internal Helpers ---

async function handlePullRequest(payload: any): Promise<GatekeeperResult> {
    const prNumber = payload.pull_request?.number;
    const repoFullName = payload.repository?.full_name;

    console.log(`🛑 Gatekeeper: Evaluating PR #${prNumber} on ${repoFullName}`);

    // In a full implementation, this would:
    // 1. Fetch changed files from the PR
    // 2. Run scanner on changed files
    // 3. Evaluate against thresholds
    // 4. Post check run / PR comment via GitHub API

    return {
        shouldBlock: false,
        findings: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    };
}

export default router;
