// ============================================
// CipherX – Auth Service (Supabase)
// ============================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getPool, JwtPayload, UserRole } from '@cipherx/common';

const pool = getPool();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export async function registerUser(
    { email, password, fullName, orgName }: { email: string; password: string; fullName: string; orgName?: string }
) {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
        throw new Error('USER_EXISTS');
    }

    // Create organization (schema: name, slug, pricing_tier)
    const baseSlug = (orgName || 'org').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'org';
    const slug = `${baseSlug}-${uuidv4().slice(0, 8)}`;
    const orgResult = await pool.query(
        `INSERT INTO organizations (name, slug, pricing_tier) VALUES ($1, $2, 'free') RETURNING id`,
        [orgName || 'My Organization', slug]
    );
    const orgId = orgResult.rows[0].id;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const userResult = await pool.query(
        `INSERT INTO users (org_id, email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, created_at`,
        [orgId, email, passwordHash, fullName, UserRole.Admin]
    );

    const user = userResult.rows[0];
    const tokens = generateTokens(user.id, orgId, email, UserRole.Admin);

    // Audit log
    await pool.query(
        `INSERT INTO audit_logs (org_id, user_id, action, resource_type, resource_id, details)
     VALUES ($1, $2, 'user.registered', 'user', $3, $4)`,
        [orgId, user.id, user.id, JSON.stringify({ email, orgName })]
    );

    return { user, token: tokens.accessToken, tokens };
}

export async function loginUser({ email, password }: { email: string; password: string }) {
    const result = await pool.query(
        'SELECT id, org_id, email, password_hash, full_name, role FROM users WHERE email = $1',
        [email]
    );

    if (result.rows.length === 0) {
        throw new Error('INVALID_CREDENTIALS');
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
        throw new Error('INVALID_CREDENTIALS');
    }

    const tokens = generateTokens(user.id, user.org_id, user.email, user.role);

    // Audit log
    await pool.query(
        `INSERT INTO audit_logs (org_id, user_id, action, resource_type, resource_id)
     VALUES ($1, $2, 'user.login', 'user', $3)`,
        [user.org_id, user.id, user.id]
    );

    return {
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, orgId: user.org_id },
        token: tokens.accessToken,
        tokens,
    };
}

export async function refreshTokens(refreshTokenValue: string) {
    try {
        const decoded = jwt.verify(refreshTokenValue, JWT_SECRET) as JwtPayload & { type: string };
        if (decoded.type !== 'refresh') throw new Error('INVALID_TOKEN');

        const result = await pool.query('SELECT id, org_id, email, role FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length === 0) throw new Error('USER_NOT_FOUND');

        const user = result.rows[0];
        return generateTokens(user.id, user.org_id, user.email, user.role);
    } catch {
        throw new Error('INVALID_REFRESH_TOKEN');
    }
}

export async function getUserProfile(userId: string) {
    const result = await pool.query(
        `SELECT u.id, u.email, u.full_name, u.role, u.created_at, o.name as org_name, o.plan
     FROM users u JOIN organizations o ON u.org_id = o.id WHERE u.id = $1`,
        [userId]
    );

    if (result.rows.length === 0) throw new Error('USER_NOT_FOUND');
    return result.rows[0];
}

function generateTokens(userId: string, orgId: string, email: string, role: string) {
    const payload: JwtPayload = { userId, orgId, email, role: role as UserRole };

    const accessToken = jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRY,
    } as jwt.SignOptions);

    const refreshTokenValue = jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRY,
    } as jwt.SignOptions);

    return { accessToken, refreshToken: refreshTokenValue };
}

export { pool };
