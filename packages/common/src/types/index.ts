// ============================================
// CipherX – Shared Type Definitions
// ============================================

// --- Enums ---

export enum UserRole {
    Developer = 'developer',
    SecurityAnalyst = 'security_analyst',
    CISO = 'ciso',
    Auditor = 'auditor',
    Admin = 'admin',
}

export enum ScanStatus {
    Pending = 'pending',
    Running = 'running',
    Completed = 'completed',
    Failed = 'failed',
    Cancelled = 'cancelled',
}

export enum SeverityLevel {
    Info = 'info',
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    Critical = 'critical',
}

export enum RepoProvider {
    GitHub = 'github',
    GitLab = 'gitlab',
    Bitbucket = 'bitbucket',
    Local = 'local',
}

export enum PricingTier {
    Free = 'free',
    Pro = 'pro',
    Enterprise = 'enterprise',
    ApiOnly = 'api_only',
}

export enum FindingStatus {
    Open = 'open',
    Acknowledged = 'acknowledged',
    Remediated = 'remediated',
    FalsePositive = 'false_positive',
    AcceptedRisk = 'accepted_risk',
}

// --- Interfaces ---

export interface Organization {
    id: string;
    name: string;
    slug: string;
    pricingTier: PricingTier;
    maxRepos: number;
    maxScansPerMonth: number;
    maxAiCallsPerMonth: number;
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    orgId: string;
    email: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Repository {
    id: string;
    orgId: string;
    name: string;
    fullName: string;
    provider: RepoProvider;
    providerId?: string;
    cloneUrl?: string;
    defaultBranch: string;
    isPublic: boolean;
    lastScannedAt?: Date;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface Scan {
    id: string;
    orgId: string;
    repoId: string;
    triggeredBy?: string;
    status: ScanStatus;
    branch?: string;
    commitSha?: string;
    totalFilesScanned: number;
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    startedAt?: Date;
    completedAt?: Date;
    errorMessage?: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
}

export interface Finding {
    id: string;
    orgId: string;
    scanId: string;
    repoId: string;
    filePath: string;
    lineNumber?: number;
    columnNumber?: number;
    algorithm?: string;
    keyLength?: number;
    usageContext?: string;
    exposureLevel?: string;
    detectedIssue: string;
    codeSnippet?: string;
    language?: string;
    severity: SeverityLevel;
    status: FindingStatus;
    riskScore?: number;
    complianceFrameworks: string[];
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface RiskAssessment {
    id: string;
    findingId: string;
    orgId: string;
    riskScore: number;
    severity: SeverityLevel;
    businessImpact?: string;
    complianceImpact: Record<string, unknown>;
    remediationSummary?: string;
    aiModel?: string;
    aiTokensUsed?: number;
    cached: boolean;
    createdAt: Date;
}

export interface Remediation {
    id: string;
    findingId: string;
    orgId: string;
    secureCode: string;
    explanation: string;
    vulnerabilityReason: string;
    bestPractices: string[];
    language?: string;
    framework?: string;
    securityStandard?: string;
    aiModel?: string;
    aiTokensUsed?: number;
    cached: boolean;
    createdAt: Date;
}

export interface ComplianceMapping {
    id: string;
    findingId: string;
    framework: string;
    controlId: string;
    controlName: string;
    description?: string;
    status: string;
    createdAt: Date;
}

export interface AuditLog {
    id: string;
    orgId?: string;
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    details: Record<string, unknown>;
    createdAt: Date;
}

// --- API Types ---

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        pageSize?: number;
        total?: number;
        totalPages?: number;
    };
}

export interface PaginationQuery {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface JwtPayload {
    userId: string;
    orgId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

// --- AI Types ---

export interface RiskAnalysisRequest {
    codeSnippet: string;
    filePath: string;
    algorithm: string;
    language: string;
    repoMetadata: {
        name: string;
        isPublic: boolean;
        provider: RepoProvider;
    };
    deploymentContext: 'public' | 'internal' | 'unknown';
    detectedIssue: string;
}

export interface RiskAnalysisResponse {
    riskScore: number;
    severity: SeverityLevel;
    businessImpact: string;
    complianceImpact: {
        owasp?: string;
        nist?: string;
        pciDss?: string;
        iso27001?: string;
    };
    remediationSummary: string;
}

export interface RemediationRequest {
    codeSnippet: string;
    language: string;
    framework?: string;
    detectedIssue: string;
    securityStandard: 'nist' | 'owasp' | 'pci_dss' | 'iso_27001';
}

export interface RemediationResponse {
    secureCode: string;
    explanation: string;
    vulnerabilityReason: string;
    bestPractices: string[];
}

// --- Scanner Types ---

export interface CryptoDetection {
    type: CryptoIssueType;
    algorithm?: string;
    keyLength?: number;
    filePath: string;
    lineNumber: number;
    columnNumber: number;
    codeSnippet: string;
    usageContext: string;
    exposureLevel: 'high' | 'medium' | 'low';
    severity: SeverityLevel;
    description: string;
}

export enum CryptoIssueType {
    WeakAlgorithm = 'weak_algorithm',
    HardcodedKey = 'hardcoded_key',
    StaticIV = 'static_iv',
    UnsaltedHash = 'unsalted_hash',
    WeakKeyLength = 'weak_key_length',
    DeprecatedTLS = 'deprecated_tls',
    InsecureMode = 'insecure_mode',
    DeprecatedLibrary = 'deprecated_library',
}
