// ============================================
// CipherX – Remediation Service (Supabase)
// ============================================

import Redis from 'ioredis';
import OpenAI from 'openai';
import { RemediationRequest, RemediationResponse, hashPrompt, retryWithBackoff, requireEnv, getPool } from '@cipherx/common';
import { buildRemediationPrompt } from '../prompts/remediation';

const pool = getPool();

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    lazyConnect: true,
});
redis.connect().catch(() => console.warn('⚠️  Redis not available'));

const openai = new OpenAI({
    apiKey: requireEnv('OPENAI_API_KEY'),
    timeout: parseInt(process.env.OPENAI_TIMEOUT_MS || '30000'),
    maxRetries: 0,
});

const CACHE_TTL = 604800;

export async function generateRemediation(
    findingId: string, orgId: string, input: RemediationRequest
): Promise<RemediationResponse> {
    const { system, user } = buildRemediationPrompt(input);
    const promptHash = hashPrompt(system + user);
    const cacheKey = `remed:${promptHash}`;

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached) as RemediationResponse;
            await storeRemediation(findingId, orgId, parsed, input, 'cached', 0, promptHash, true);
            return parsed;
        }
    } catch { /* continue */ }

    const response = await retryWithBackoff(async () => {
        return openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
            temperature: 0.2,
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2048'),
            response_format: { type: 'json_object' },
        });
    }, { maxRetries: 3 });

    const content = response.choices[0]?.message?.content || '{}';
    const tokensUsed = response.usage?.total_tokens || 0;
    let result: RemediationResponse;

    try { result = JSON.parse(content); } catch { throw new Error('AI_RESPONSE_PARSE_ERROR'); }
    if (!result.secureCode || !result.explanation) throw new Error('AI_RESPONSE_INCOMPLETE');

    try { await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result)); } catch { /* non-critical */ }

    await storeRemediation(findingId, orgId, result, input, process.env.OPENAI_MODEL || 'gpt-4o', tokensUsed, promptHash, false);

    await pool.query(
        `INSERT INTO usage_metrics (org_id, metric_type, metric_value, period_start, period_end)
     VALUES ($1, 'ai_calls', 1, date_trunc('month', NOW()), date_trunc('month', NOW()) + interval '1 month' - interval '1 day')
     ON CONFLICT (org_id, metric_type, period_start)
     DO UPDATE SET metric_value = usage_metrics.metric_value + 1`,
        [orgId]
    );

    return result;
}

async function storeRemediation(
    findingId: string, orgId: string, result: RemediationResponse,
    input: RemediationRequest, model: string, tokensUsed: number, promptHash: string, cached: boolean
) {
    await pool.query(
        `INSERT INTO remediations (finding_id, org_id, secure_code, explanation, vulnerability_reason,
     best_practices, language, framework, security_standard, ai_model, ai_tokens_used, prompt_hash, cached)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [findingId, orgId, result.secureCode, result.explanation, result.vulnerabilityReason,
            result.bestPractices || [], input.language, input.framework || null,
            input.securityStandard, model, tokensUsed, promptHash, cached]
    );
}

export { pool };
