// ============================================
// CipherX – Remediation Prompt Templates
// ============================================

import { RemediationRequest } from '@cipherx/common';

const STANDARD_CONTEXT: Record<string, string> = {
    nist: 'NIST SP 800-57 (Recommendation for Key Management) and NIST SP 800-131A (Transitioning the Use of Cryptographic Algorithms)',
    owasp: 'OWASP Cryptographic Failures (A02:2021) and OWASP Cheat Sheet Series',
    pci_dss: 'PCI-DSS v4.0 Requirements 3 (Protect Stored Account Data) and 4 (Protect Cardholder Data)',
    iso_27001: 'ISO 27001:2022 Annex A.10 (Cryptographic Controls)',
};

export function buildRemediationPrompt(input: RemediationRequest): { system: string; user: string } {
    const standardDesc = STANDARD_CONTEXT[input.securityStandard] || input.securityStandard;

    const system = `You are a senior security engineer specializing in secure cryptographic implementations. You generate production-ready, copy-pasteable secure code replacements.

You MUST respond with valid JSON in exactly this format:
{
  "secureCode": "<complete, working, production-ready code replacement>",
  "explanation": "<clear explanation of the changes made and why>",
  "vulnerabilityReason": "<why the original code was insecure>",
  "bestPractices": ["<practice 1>", "<practice 2>", "<practice 3>"]
}

Requirements for your remediation:
1. The secure code MUST be a complete drop-in replacement — not a snippet or partial fix.
2. Use modern, well-maintained libraries appropriate for the language.
3. Follow ${standardDesc} guidelines specifically.
4. Include proper error handling.
5. Use secure defaults (e.g., AES-256-GCM, SHA-256+, bcrypt for passwords, RSA >= 2048).
6. Never hardcode keys, IVs, or secrets — use environment variables or secure key management.
7. Add inline comments explaining security-critical decisions.
8. The code must be idiomatic for ${input.language}${input.framework ? ' using ' + input.framework : ''}.`;

    const user = `Fix this cryptographic vulnerability:

**Language**: ${input.language}
${input.framework ? `**Framework**: ${input.framework}` : ''}
**Security Standard**: ${input.securityStandard.toUpperCase()}
**Detected Issue**: ${input.detectedIssue}

**Vulnerable Code**:
\`\`\`${input.language}
${input.codeSnippet}
\`\`\`

Generate a production-ready secure replacement as structured JSON.`;

    return { system, user };
}
