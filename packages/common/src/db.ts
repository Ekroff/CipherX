// ============================================
// CipherX – Shared Database Connection (Supabase PostgreSQL)
// ============================================

import { Pool, PoolConfig } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a PostgreSQL connection pool configured for Supabase.
 * All services should use this instead of creating their own Pool.
 */
export function createPool(): Pool {
    const config: PoolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    };

    // Enable SSL for Supabase (required for cloud-hosted PostgreSQL)
    if (process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production') {
        config.ssl = { rejectUnauthorized: false };
    }

    const pool = new Pool(config);

    pool.on('error', (err) => {
        console.error('Unexpected database pool error:', err);
    });

    return pool;
}

/**
 * Creates a Supabase JS client (for Supabase-specific features:
 * Auth, Realtime, Storage, Edge Functions, etc.)
 */
export function createSupabaseClient(): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required.');
    }

    return createClient(url, key, {
        auth: { persistSession: false },
    });
}

// Singleton pool instance
let _pool: Pool | null = null;

/**
 * Get the shared pool instance (lazy-initialized singleton)
 */
export function getPool(): Pool {
    if (!_pool) {
        _pool = createPool();
    }
    return _pool;
}
