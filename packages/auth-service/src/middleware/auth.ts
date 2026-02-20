// ============================================
// CipherX – Auth Service: JWT & RBAC Middleware
// ============================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, JwtPayload, errorResponse } from '@cipherx/common';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

/**
 * Middleware: Verify JWT token and attach user to request
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json(errorResponse('AUTH_REQUIRED', 'Authentication required. Provide a valid Bearer token.'));
        return;
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json(errorResponse('TOKEN_EXPIRED', 'Token has expired. Please refresh your token.'));
            return;
        }
        res.status(401).json(errorResponse('INVALID_TOKEN', 'Invalid authentication token.'));
        return;
    }
}

/**
 * Middleware: Authorize based on user roles
 */
export function authorize(...allowedRoles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json(errorResponse('AUTH_REQUIRED', 'Authentication required.'));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json(errorResponse('FORBIDDEN', `Access denied. Required roles: ${allowedRoles.join(', ')}`));
            return;
        }

        next();
    };
}

/**
 * Generate JWT access token (short-lived)
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    });
}

/**
 * Generate JWT refresh token (long-lived)
 */
export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    });
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
