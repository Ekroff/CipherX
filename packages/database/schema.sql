-- ============================================
-- CipherX Database Schema
-- PostgreSQL 16+
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('developer', 'security_analyst', 'ciso', 'auditor', 'admin');
CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE severity_level AS ENUM ('info', 'low', 'medium', 'high', 'critical');
CREATE TYPE repo_provider AS ENUM ('github', 'gitlab', 'bitbucket', 'local');
CREATE TYPE pricing_tier AS ENUM ('free', 'pro', 'enterprise', 'api_only');
CREATE TYPE finding_status AS ENUM ('open', 'acknowledged', 'remediated', 'false_positive', 'accepted_risk');

-- ============================================
-- ORGANIZATIONS (Multi-Tenant)
-- ============================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    pricing_tier pricing_tier NOT NULL DEFAULT 'free',
    max_repos INT NOT NULL DEFAULT 1,
    max_scans_per_month INT NOT NULL DEFAULT 10,
    max_ai_calls_per_month INT NOT NULL DEFAULT 5,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'developer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- API KEYS
-- ============================================

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org ON api_keys(org_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- ============================================
-- REPOSITORIES
-- ============================================

CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) NOT NULL,
    provider repo_provider NOT NULL,
    provider_id VARCHAR(255),
    clone_url TEXT,
    default_branch VARCHAR(100) DEFAULT 'main',
    is_public BOOLEAN DEFAULT false,
    last_scanned_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, provider, full_name)
);

CREATE INDEX idx_repos_org ON repositories(org_id);
CREATE INDEX idx_repos_provider ON repositories(provider);

-- ============================================
-- SCANS
-- ============================================

CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES users(id),
    status scan_status NOT NULL DEFAULT 'pending',
    branch VARCHAR(255),
    commit_sha VARCHAR(64),
    total_files_scanned INT DEFAULT 0,
    total_findings INT DEFAULT 0,
    critical_count INT DEFAULT 0,
    high_count INT DEFAULT 0,
    medium_count INT DEFAULT 0,
    low_count INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scans_org ON scans(org_id);
CREATE INDEX idx_scans_repo ON scans(repo_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_created ON scans(created_at DESC);

-- ============================================
-- FINDINGS (CBOM Format)
-- ============================================

CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    line_number INT,
    column_number INT,
    algorithm VARCHAR(100),
    key_length INT,
    usage_context TEXT,
    exposure_level VARCHAR(50),
    detected_issue TEXT NOT NULL,
    code_snippet TEXT,
    language VARCHAR(50),
    severity severity_level NOT NULL DEFAULT 'medium',
    status finding_status NOT NULL DEFAULT 'open',
    risk_score DECIMAL(3,1),
    compliance_frameworks TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_findings_org ON findings(org_id);
CREATE INDEX idx_findings_scan ON findings(scan_id);
CREATE INDEX idx_findings_repo ON findings(repo_id);
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_findings_algorithm ON findings(algorithm);

-- ============================================
-- RISK ASSESSMENTS (AI-Powered)
-- ============================================

CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    risk_score DECIMAL(3,1) NOT NULL,
    severity severity_level NOT NULL,
    business_impact TEXT,
    compliance_impact JSONB DEFAULT '{}',
    remediation_summary TEXT,
    ai_model VARCHAR(50),
    ai_tokens_used INT,
    prompt_hash VARCHAR(64),
    cached BOOLEAN DEFAULT false,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_finding ON risk_assessments(finding_id);
CREATE INDEX idx_risk_prompt_hash ON risk_assessments(prompt_hash);

-- ============================================
-- REMEDIATIONS (AI-Generated)
-- ============================================

CREATE TABLE remediations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    secure_code TEXT NOT NULL,
    explanation TEXT NOT NULL,
    vulnerability_reason TEXT NOT NULL,
    best_practices TEXT[],
    language VARCHAR(50),
    framework VARCHAR(100),
    security_standard VARCHAR(50),
    ai_model VARCHAR(50),
    ai_tokens_used INT,
    prompt_hash VARCHAR(64),
    cached BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_remediation_finding ON remediations(finding_id);
CREATE INDEX idx_remediation_prompt_hash ON remediations(prompt_hash);

-- ============================================
-- COMPLIANCE MAPPINGS
-- ============================================

CREATE TABLE compliance_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    framework VARCHAR(50) NOT NULL,
    control_id VARCHAR(50) NOT NULL,
    control_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'non_compliant',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_finding ON compliance_mappings(finding_id);
CREATE INDEX idx_compliance_framework ON compliance_mappings(framework);

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON audit_logs(org_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- USAGE METRICS (Billing / Metering)
-- ============================================

CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_value INT NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, metric_type, period_start)
);

CREATE INDEX idx_usage_org ON usage_metrics(org_id);
CREATE INDEX idx_usage_period ON usage_metrics(period_start, period_end);

-- ============================================
-- CI/CD INTEGRATIONS
-- ============================================

CREATE TABLE cicd_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    repo_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    webhook_url TEXT,
    webhook_secret_hash VARCHAR(255),
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cicd_org ON cicd_integrations(org_id);
CREATE INDEX idx_cicd_repo ON cicd_integrations(repo_id);

-- ============================================
-- SEED: Default Admin Organization
-- ============================================

INSERT INTO organizations (name, slug, pricing_tier, max_repos, max_scans_per_month, max_ai_calls_per_month)
VALUES ('CipherX Admin', 'cipherx-admin', 'enterprise', 999, 99999, 99999);
