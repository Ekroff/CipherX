// ============================================
// CipherX – Risk Analysis Prompt Templates
// ============================================

import { RiskAnalysisRequest } from '@cipherx/common';

export function buildRiskAnalysisPrompt(input: RiskAnalysisRequest): { system: string; user: string } {
    const system = `You are a senior cryptographic security auditor with deep expertise in applied cryptography, compliance frameworks (OWASP, NIST SP 800-57, PCI-DSS, ISO 27001), and enterprise risk assessment.

Your task is to analyze a cryptographic vulnerability finding and provide a structured risk assessment.

You MUST respond with valid JSON in exactly this format:
{
  "riskScore": <number 1-10>,
  "severity": "<Low|Medium|High|Critical>",
  "businessImpact": "<2-3 sentence explanation of business risk>",
  "complianceImpact": {
    "owasp": "<relevant OWASP control or null>",
    "nist": "<relevant NIST control or null>",
    "pciDss": "<relevant PCI-DSS requirement or null>",
    "iso27001": "<relevant ISO 27001 control or null>"
  },
  "remediationSummary": "<concise remediation guidance>"
}

Scoring Guidelines:
- 1-3: Low risk. Internal use, no sensitive data, defense in depth exists.
- 4-6: Medium risk. Some exposure, non-critical data, partial mitigations.
- 7-8: High risk. Public-facing, sensitive data, regulatory implications.
- 9-10: Critical risk. Authentication/encryption bypass, PII/financial data exposure, active exploit potential.

Factor in deployment context: public-facing services score higher than internal tools.`;

    const user = `Analyze this cryptographic vulnerability:

**Repository**: ${input.repoMetadata.name} (${input.repoMetadata.isPublic ? 'PUBLIC' : 'PRIVATE'})
**Provider**: ${input.repoMetadata.provider}
**Deployment Context**: ${input.deploymentContext}
**File**: ${input.filePath}
**Language**: ${input.language}
**Detected Algorithm/Issue**: ${input.algorithm}
**Issue Description**: ${input.detectedIssue}

**Code Snippet**:
\`\`\`${input.language}
${input.codeSnippet}
\`\`\`

Provide your risk assessment as structured JSON.`;

    return { system, user };
}
