// ============================================
// CipherX – Shared Utilities
// ============================================

import { ApiResponse, PaginationQuery } from '../types';

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
    return { success: true, data, meta };
}

/**
 * Create an error API response
 */
export function errorResponse(code: string, message: string, details?: unknown): ApiResponse {
    return { success: false, error: { code, message, details } };
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(total: number, query: PaginationQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const totalPages = Math.ceil(total / pageSize);
    return { page, pageSize, total, totalPages };
}

/**
 * Calculate SQL OFFSET from pagination
 */
export function paginationToOffset(query: PaginationQuery): { limit: number; offset: number } {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    return { limit: pageSize, offset: (page - 1) * pageSize };
}

/**
 * Generate a deterministic hash for caching AI prompts
 */
export function hashPrompt(content: string): string {
    // Simple djb2 hash for prompt deduplication
    let hash = 5381;
    for (let i = 0; i < content.length; i++) {
        hash = ((hash << 5) + hash) + content.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Sanitize a string for safe logging (remove potential secrets)
 */
export function sanitizeForLog(text: string, maxLength = 500): string {
    const sanitized = text
        .replace(/(['"]?(?:password|secret|key|token|api_key|apiKey)['"]?\s*[:=]\s*)(['"]?)([^'"\s,;}\]]+)\2/gi, '$1$2[REDACTED]$2')
        .substring(0, maxLength);
    return sanitized.length < text.length ? sanitized + '...' : sanitized;
}

/**
 * Sleep utility for retry logic
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: { maxRetries?: number; baseDelayMs?: number; maxDelayMs?: number } = {}
): Promise<T> {
    const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (attempt < maxRetries) {
                const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
                const jitter = delay * (0.5 + Math.random() * 0.5);
                await sleep(jitter);
            }
        }
    }

    throw lastError;
}

/**
 * Validate that required environment variables are set
 */
export function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
}

/**
 * Get an environment variable with a default value
 */
export function getEnv(name: string, defaultValue: string): string {
    return process.env[name] ?? defaultValue;
}
