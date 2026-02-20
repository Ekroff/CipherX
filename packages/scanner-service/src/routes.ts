// ============================================
// CipherX – Scanner Service: Routes
// ============================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse } from '@cipherx/common';
import {
    createScan, executeScan, getScanStatus, getFindings,
    connectRepository, listRepositories, FileEntry
} from './services/scanner.service';

const router = Router();

// --- Validation Schemas ---
const connectRepoSchema = z.object({
    name: z.string().min(1),
    fullName: z.string().min(1),
    provider: z.enum(['github', 'gitlab', 'bitbucket', 'local']),
    cloneUrl: z.string().url().optional(),
    isPublic: z.boolean().optional(),
});

const startScanSchema = z.object({
    repoId: z.string().uuid(),
    branch: z.string().optional(),
    files: z.array(z.object({
        path: z.string(),
        content: z.string(),
    })).optional(),
});

// --- Routes ---

/**
 * POST /scanner/repos/connect
 */
router.post('/repos/connect', async (req: Request, res: Response) => {
    try {
        const parsed = connectRepoSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input', parsed.error.errors));
            return;
        }

        // orgId comes from JWT middleware (set by API gateway)
        const orgId = (req as any).user?.orgId || req.headers['x-org-id'] as string;
        if (!orgId) {
            res.status(401).json(errorResponse('AUTH_REQUIRED', 'Organization context required.'));
            return;
        }

        const repo = await connectRepository(orgId, parsed.data);
        res.status(201).json(successResponse(repo));
    } catch (error: any) {
        console.error('Connect repo error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to connect repository.'));
    }
});

/**
 * GET /scanner/repos
 */
router.get('/repos', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).user?.orgId || req.headers['x-org-id'] as string;
        if (!orgId) {
            res.status(401).json(errorResponse('AUTH_REQUIRED', 'Organization context required.'));
            return;
        }

        const repos = await listRepositories(orgId);
        res.json(successResponse(repos));
    } catch (error) {
        console.error('List repos error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to list repositories.'));
    }
});

/**
 * POST /scanner/scan/start
 */
router.post('/scan/start', async (req: Request, res: Response) => {
    try {
        const parsed = startScanSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input', parsed.error.errors));
            return;
        }

        const orgId = (req as any).user?.orgId || req.headers['x-org-id'] as string;
        const userId = (req as any).user?.userId || req.headers['x-user-id'] as string;

        const scanId = await createScan(orgId, parsed.data.repoId, userId, parsed.data.branch);

        // If files provided directly, scan immediately (for demo/local mode)
        if (parsed.data.files && parsed.data.files.length > 0) {
            // Execute scan async
            executeScan(scanId, orgId, parsed.data.repoId, parsed.data.files as FileEntry[])
                .catch(err => console.error(`Scan ${scanId} failed:`, err));
        }

        res.status(202).json(successResponse({ scanId, status: 'pending' }));
    } catch (error) {
        console.error('Start scan error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to start scan.'));
    }
});

/**
 * GET /scanner/scan/:id/status
 */
router.get('/scan/:id/status', async (req: Request, res: Response) => {
    try {
        const scan = await getScanStatus(req.params.id);
        if (!scan) {
            res.status(404).json(errorResponse('NOT_FOUND', 'Scan not found.'));
            return;
        }
        res.json(successResponse(scan));
    } catch (error) {
        console.error('Scan status error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to get scan status.'));
    }
});

/**
 * GET /scanner/findings
 */
router.get('/findings', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).user?.orgId || req.headers['x-org-id'] as string;
        if (!orgId) {
            res.status(401).json(errorResponse('AUTH_REQUIRED', 'Organization context required.'));
            return;
        }

        const result = await getFindings(orgId, {
            scanId: req.query.scanId as string,
            repoId: req.query.repoId as string,
            severity: req.query.severity as string,
            status: req.query.status as string,
            algorithm: req.query.algorithm as string,
            page: req.query.page ? parseInt(req.query.page as string) : undefined,
            pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
        });

        res.json(successResponse(result.findings, result.pagination));
    } catch (error) {
        console.error('Get findings error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Failed to get findings.'));
    }
});

export default router;
