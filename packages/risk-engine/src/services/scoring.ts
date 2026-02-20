// ============================================
// CipherX – Risk Scoring Service (Supabase)
// ============================================

import Redis from 'ioredis';
import {
    RiskAnalysisRequest, RiskAnalysisResponse, SeverityLevel,
    hashPrompt, getPool
} from '@cipherx/common';
import { callOpenAI, parseAIResponse } from './openai';
import { buildRiskAnalysisPrompt } from '../prompts/risk-analysis';

const pool = getPool();

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
});
redis.connect().catch(() => console.warn('⚠️  Redis not available, caching disabled'));

const CACHE_TTL = 86400;

export async function analyzeRisk(
    findingId: string, orgId: string, input: RiskAnalysisRequest
): Promise<RiskAnalysisResponse> {
    const { system, user } = buildRiskAnalysisPrompt(input);
    const cacheKey = `risk:${hashPrompt(system + user)}`;

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached) as RiskAnalysisResponse;
            await storeRiskAssessment(findingId, orgId, parsed, 'cached', 0, cacheKey, true);
            return parsed;
        }
    } catch { /* continue */ }

    const aiResponse = await callOpenAI({ systemPrompt: system, userPrompt: user, temperature: 0.2 });
    const result = parseAIResponse<RiskAnalysisResponse>(aiResponse.content);
    if (!result) throw new Error('AI_RESPONSE_PARSE_ERROR');

    const normalized: RiskAnalysisResponse = {
        riskScore: Math.max(1, Math.min(10, result.riskScore)),
        severity: normalizeSeverity(result.severity as string),
        businessImpact: result.businessImpact || 'Unable to assess business impact.',
        complianceImpact: result.complianceImpact || {},
        remediationSummary: result.remediationSummary || 'Review and update cryptographic implementation.',
    };

    try { await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(normalized)); } catch { /* non-critical */ }

    await storeRiskAssessment(findingId, orgId, normalized, aiResponse.model, aiResponse.tokensUsed, aiResponse.promptHash, false);

    await pool.query(
        `UPDATE findings SET risk_score = $1, severity = $2, updated_at = NOW() WHERE id = $3`,
        [normalized.riskScore, normalized.severity.toLowerCase(), findingId]
    );

    await pool.query(
        `INSERT INTO usage_metrics (org_id, metric_type, metric_value, period_start, period_end)
     VALUES ($1, 'ai_calls', 1, date_trunc('month', NOW()), date_trunc('month', NOW()) + interval '1 month' - interval '1 day')
     ON CONFLICT (org_id, metric_type, period_start)
     DO UPDATE SET metric_value = usage_metrics.metric_value + 1`,
        [orgId]
    );

    return normalized;
}

async function storeRiskAssessment(
    findingId: string, orgId: string, result: RiskAnalysisResponse,
    model: string, tokensUsed: number, promptHash: string, cached: boolean
) {
    await pool.query(
        `INSERT INTO risk_assessments (finding_id, org_id, risk_score, severity, business_impact,
     compliance_impact, remediation_summary, ai_model, ai_tokens_used, prompt_hash, cached)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [findingId, orgId, result.riskScore, result.severity.toLowerCase(),
            result.businessImpact, JSON.stringify(result.complianceImpact),
            result.remediationSummary, model, tokensUsed, promptHash, cached]
    );
}

function normalizeSeverity(input: string): SeverityLevel {
    const lower = input.toLowerCase();
    if (lower === 'critical') return SeverityLevel.Critical;
    if (lower === 'high') return SeverityLevel.High;
    if (lower === 'medium') return SeverityLevel.Medium;
    if (lower === 'low') return SeverityLevel.Low;
    return SeverityLevel.Medium;
}

export { pool };
