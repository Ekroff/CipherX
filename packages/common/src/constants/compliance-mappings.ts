// ============================================
// CipherX – Compliance Framework Mappings
// ============================================

export interface ComplianceControl {
    framework: string;
    controlId: string;
    controlName: string;
    description: string;
    cryptoIssueTypes: string[];
}

// OWASP Top 10 - A02:2021 Cryptographic Failures
export const OWASP_MAPPINGS: ComplianceControl[] = [
    {
        framework: 'OWASP',
        controlId: 'A02:2021',
        controlName: 'Cryptographic Failures',
        description: 'Failures related to cryptography which often lead to sensitive data exposure.',
        cryptoIssueTypes: ['weak_algorithm', 'hardcoded_key', 'static_iv', 'unsalted_hash', 'weak_key_length', 'insecure_mode'],
    },
    {
        framework: 'OWASP',
        controlId: 'A07:2021',
        controlName: 'Identification and Authentication Failures',
        description: 'Confirmation of user identity, authentication, and session management.',
        cryptoIssueTypes: ['unsalted_hash', 'weak_algorithm'],
    },
    {
        framework: 'OWASP',
        controlId: 'A09:2021',
        controlName: 'Security Logging and Monitoring Failures',
        description: 'Without logging and monitoring, breaches cannot be detected.',
        cryptoIssueTypes: ['hardcoded_key'],
    },
];

// NIST SP 800-57 - Key Management
export const NIST_MAPPINGS: ComplianceControl[] = [
    {
        framework: 'NIST SP 800-57',
        controlId: 'NIST-KM-1',
        controlName: 'Key Generation',
        description: 'Keys must be generated using approved algorithms with sufficient length.',
        cryptoIssueTypes: ['weak_key_length', 'weak_algorithm'],
    },
    {
        framework: 'NIST SP 800-57',
        controlId: 'NIST-KM-2',
        controlName: 'Key Storage',
        description: 'Cryptographic keys must be protected when stored.',
        cryptoIssueTypes: ['hardcoded_key'],
    },
    {
        framework: 'NIST SP 800-57',
        controlId: 'NIST-KM-3',
        controlName: 'Algorithm Selection',
        description: 'Only approved cryptographic algorithms should be used.',
        cryptoIssueTypes: ['weak_algorithm', 'deprecated_library', 'insecure_mode'],
    },
    {
        framework: 'NIST SP 800-57',
        controlId: 'NIST-KM-4',
        controlName: 'IV/Nonce Management',
        description: 'Initialization vectors and nonces must be unique and unpredictable.',
        cryptoIssueTypes: ['static_iv'],
    },
];

// PCI-DSS Requirements
export const PCI_DSS_MAPPINGS: ComplianceControl[] = [
    {
        framework: 'PCI-DSS',
        controlId: 'PCI-3.4',
        controlName: 'Render PAN Unreadable',
        description: 'Render PAN unreadable anywhere it is stored using strong cryptography.',
        cryptoIssueTypes: ['weak_algorithm', 'weak_key_length', 'insecure_mode'],
    },
    {
        framework: 'PCI-DSS',
        controlId: 'PCI-3.5',
        controlName: 'Protect Stored Cryptographic Keys',
        description: 'Document and implement procedures to protect keys used to secure stored data.',
        cryptoIssueTypes: ['hardcoded_key'],
    },
    {
        framework: 'PCI-DSS',
        controlId: 'PCI-4.1',
        controlName: 'Strong Cryptography for Transmission',
        description: 'Use strong cryptography to safeguard sensitive data during transmission.',
        cryptoIssueTypes: ['deprecated_tls', 'weak_algorithm', 'weak_key_length'],
    },
    {
        framework: 'PCI-DSS',
        controlId: 'PCI-6.5',
        controlName: 'Address Common Coding Vulnerabilities',
        description: 'Address common coding vulnerabilities in software development processes.',
        cryptoIssueTypes: ['static_iv', 'unsalted_hash', 'weak_algorithm'],
    },
];

// ISO 27001 Controls
export const ISO_27001_MAPPINGS: ComplianceControl[] = [
    {
        framework: 'ISO 27001',
        controlId: 'A.10.1.1',
        controlName: 'Policy on Use of Cryptographic Controls',
        description: 'A policy on the use of cryptographic controls for protection of information shall be developed.',
        cryptoIssueTypes: ['weak_algorithm', 'deprecated_library', 'insecure_mode'],
    },
    {
        framework: 'ISO 27001',
        controlId: 'A.10.1.2',
        controlName: 'Key Management',
        description: 'A policy on the use, protection and lifetime of cryptographic keys shall be developed.',
        cryptoIssueTypes: ['hardcoded_key', 'weak_key_length', 'static_iv'],
    },
    {
        framework: 'ISO 27001',
        controlId: 'A.14.1.2',
        controlName: 'Securing Application Services',
        description: 'Secure application services on public networks to protect against fraud and unauthorized disclosure.',
        cryptoIssueTypes: ['deprecated_tls', 'weak_algorithm'],
    },
    {
        framework: 'ISO 27001',
        controlId: 'A.14.2.5',
        controlName: 'Secure System Engineering Principles',
        description: 'Principles for engineering secure systems shall be established and applied.',
        cryptoIssueTypes: ['unsalted_hash', 'static_iv', 'insecure_mode'],
    },
];

// All mappings combined
export const ALL_COMPLIANCE_MAPPINGS: ComplianceControl[] = [
    ...OWASP_MAPPINGS,
    ...NIST_MAPPINGS,
    ...PCI_DSS_MAPPINGS,
    ...ISO_27001_MAPPINGS,
];

/**
 * Find compliance controls that map to a given crypto issue type
 */
export function getComplianceMappings(issueType: string): ComplianceControl[] {
    return ALL_COMPLIANCE_MAPPINGS.filter(m => m.cryptoIssueTypes.includes(issueType));
}

/**
 * Get all unique frameworks affected by a finding
 */
export function getAffectedFrameworks(issueType: string): string[] {
    const mappings = getComplianceMappings(issueType);
    return [...new Set(mappings.map(m => m.framework))];
}
