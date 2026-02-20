// ============================================
// CipherX – Auth Service: Routes
// ============================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse, UserRole } from '@cipherx/common';
import { registerUser, loginUser, refreshTokens, getUserProfile } from './services/auth.service';
import { authenticate, AuthenticatedRequest } from './middleware/auth';

const router = Router();

// --- Validation Schemas ---
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    orgName: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

// --- Routes ---

/**
 * POST /auth/register
 * Register a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input', parsed.error.errors));
            return;
        }

        const result = await registerUser(parsed.data);
        res.status(201).json(successResponse(result));
    } catch (error: any) {
        if (error.message === 'USER_EXISTS') {
            res.status(409).json(errorResponse('USER_EXISTS', 'A user with this email already exists.'));
            return;
        }
        console.error('Registration error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.'));
    }
});

/**
 * POST /auth/login
 * Authenticate and receive tokens
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input', parsed.error.errors));
            return;
        }

        const result = await loginUser(parsed.data);
        res.status(200).json(successResponse(result));
    } catch (error: any) {
        if (error.message === 'INVALID_CREDENTIALS') {
            res.status(401).json(errorResponse('INVALID_CREDENTIALS', 'Invalid email or password.'));
            return;
        }
        if (error.message === 'ACCOUNT_DISABLED') {
            res.status(403).json(errorResponse('ACCOUNT_DISABLED', 'This account has been disabled.'));
            return;
        }
        console.error('Login error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.'));
    }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const parsed = refreshSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid input', parsed.error.errors));
            return;
        }

        const tokens = await refreshTokens(parsed.data.refreshToken);
        res.status(200).json(successResponse(tokens));
    } catch (error: any) {
        res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid or expired refresh token.'));
    }
});

/**
 * GET /auth/me
 * Get current user profile (requires auth)
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profile = await getUserProfile(req.user!.userId);
        res.status(200).json(successResponse(profile));
    } catch (error: any) {
        if (error.message === 'USER_NOT_FOUND') {
            res.status(404).json(errorResponse('USER_NOT_FOUND', 'User not found.'));
            return;
        }
        console.error('Profile error:', error);
        res.status(500).json(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.'));
    }
});

export default router;
