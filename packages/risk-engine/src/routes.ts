// ============================================
// CipherX – Risk Engine: Routes
// ============================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse, RepoProvider } from '@cipherx/common';
import { analyzeRisk } from './services/scoring';

const router = Router();

const riskAnalysisSchema = z.object({
    findingId: z.string().uuid(),
    codeSnippet: z.string().min(1),
    filePath: z.string().min(1),
    algorithm: z.string().min(1),
    language: z.string().min(1),
    repoMetadata: z.object({
        name: z.string(),
        isPublic: z.boolean(),
        provider: z.nativeEnum(RepoProvider),
    }),
    deploymentContext: z.enum(['public', 'internal', 'unknown']),
    detectedIssue: z.string().min(1),
});

/**
 * POST /risk/analyze
 */
router.post('/analyze', async (req: Request, res: Response) => {
    try {
        const parsed = riskAnalysisSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input', parsed.error.errors));
            return;
        }

        const orgId = (req as any).user?.orgId || req.headers['x-org-id'] as string;
        if (!orgId) {
            res.status(401).json(errorResponse('AUTH_REQUIRED', 'Organization context required.'));
            return;
        }

        const { findingId, ...analysisInput } = parsed.data;
        const result = await analyzeRisk(findingId, orgId, analysisInput);
        res.json(successResponse(result));
    } catch (error: any) {
        if (error.message === 'AI_RESPONSE_PARSE_ERROR') {
            res.status(502).json(errorResponse('AI_ERROR', 'Failed to parse AI response. Please retry.'));
            return;
        }
        console.error('Risk analysis error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Risk analysis failed.'));
    }
});

export default router;
