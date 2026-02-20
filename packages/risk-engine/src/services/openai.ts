// ============================================
// CipherX – Secure OpenAI Integration Layer
// ============================================
// Server-side ONLY. API key NEVER exposed to frontend.

import OpenAI from 'openai';
import { retryWithBackoff, requireEnv, hashPrompt } from '@cipherx/common';

// Validate API key exists at startup
const OPENAI_API_KEY = requireEnv('OPENAI_API_KEY');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const OPENAI_MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '2048');
const OPENAI_TIMEOUT_MS = parseInt(process.env.OPENAI_TIMEOUT_MS || '30000');

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    timeout: OPENAI_TIMEOUT_MS,
    maxRetries: 0, // We handle retries ourselves
});

export interface OpenAICallOptions {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
}

export interface OpenAIResponse {
    content: string;
    tokensUsed: number;
    model: string;
    promptHash: string;
}

// Simple in-memory rate limiter
class RateLimiter {
    private requests: number[] = [];
    private maxRPM: number;

    constructor(maxRPM: number) {
        this.maxRPM = maxRPM;
    }

    async waitForSlot(): Promise<void> {
        const now = Date.now();
        this.requests = this.requests.filter(t => now - t < 60000);

        if (this.requests.length >= this.maxRPM) {
            const oldestInWindow = this.requests[0];
            const waitTime = 60000 - (now - oldestInWindow) + 100;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.requests.push(Date.now());
    }
}

const rateLimiter = new RateLimiter(parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '60'));

/**
 * Make a secure, rate-limited, retried call to OpenAI
 */
export async function callOpenAI(options: OpenAICallOptions): Promise<OpenAIResponse> {
    const { systemPrompt, userPrompt, temperature = 0.3, maxTokens = OPENAI_MAX_TOKENS } = options;
    const promptContent = `${systemPrompt}|${userPrompt}`;
    const promptCacheHash = hashPrompt(promptContent);

    // Wait for rate limit slot
    await rateLimiter.waitForSlot();

    // Call with retry + exponential backoff
    const response = await retryWithBackoff(
        async () => {
            const completion = await openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature,
                max_tokens: maxTokens,
                response_format: { type: 'json_object' },
            });

            return completion;
        },
        { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 15000 }
    );

    const content = response.choices[0]?.message?.content || '{}';
    const tokensUsed = response.usage?.total_tokens || 0;

    return {
        content,
        tokensUsed,
        model: OPENAI_MODEL,
        promptHash: promptCacheHash,
    };
}

/**
 * Parse JSON response safely
 */
export function parseAIResponse<T>(content: string): T | null {
    try {
        return JSON.parse(content) as T;
    } catch {
        console.error('Failed to parse AI response:', content.substring(0, 200));
        return null;
    }
}
