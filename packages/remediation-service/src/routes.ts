// ============================================
// CipherX – Remediation Service: Routes
// ============================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse } from '@cipherx/common';
import { generateRemediation } from './services/remediation.service';

const router = Router();

const remediationSchema = z.object({
    findingId: z.string().uuid(),
    codeSnippet: z.string().min(1),
    language: z.string().min(1),
    framework: z.string().optional(),
    detectedIssue: z.string().min(1),
    securityStandard: z.enum(['nist', 'owasp', 'pci_dss', 'iso_27001']),
});

/**
 * POST /remediation/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const parsed = remediationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input', parsed.error.errors));
            return;
        }

        const orgId = (req as any).user?.orgId || req.headers['x-org-id'] as string;
        if (!orgId) {
            res.status(401).json(errorResponse('AUTH_REQUIRED', 'Organization context required.'));
            return;
        }

        const { findingId, ...input } = parsed.data;
        const result = await generateRemediation(findingId, orgId, input);
        res.json(successResponse(result));
    } catch (error: any) {
        if (error.message === 'AI_RESPONSE_PARSE_ERROR' || error.message === 'AI_RESPONSE_INCOMPLETE') {
            res.status(502).json(errorResponse('AI_ERROR', 'Failed to generate remediation. Please retry.'));
            return;
        }
        console.error('Remediation error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'Remediation generation failed.'));
    }
});

export default router;
