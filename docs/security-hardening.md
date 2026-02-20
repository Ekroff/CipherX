# CipherX – Security Hardening Checklist

## Authentication & Authorization
- [x] JWT with short-lived access tokens (15 min)
- [x] Long-lived refresh tokens (7 days)
- [x] Password hashing with bcrypt (12 rounds)
- [x] Role-based access control (5 roles)
- [x] Rate limiting on auth endpoints (50 req/15min)

## API Security
- [x] Helmet.js HTTP security headers
- [x] CORS with strict origin allowlist
- [x] Global rate limiting per IP
- [x] Input validation with Zod schemas on all endpoints
- [x] Structured error responses (no stack traces in production)
- [x] Request size limits (JSON payload limits per service)

## Secrets Management
- [x] All API keys in environment variables
- [x] OpenAI key strictly server-side (never in frontend)
- [x] Kubernetes Secrets for production
- [x] .env files excluded from version control (.gitignore)
- [ ] Vault/AWS Secrets Manager integration (v2)

## Data Protection
- [x] PostgreSQL pgcrypto extension enabled
- [x] Database credentials in env vars
- [x] TLS 1.3 enforced at ingress level
- [x] S3 storage with KMS encryption
- [x] Redis transit encryption enabled
- [ ] Column-level encryption for sensitive findings (v2)

## Audit & Compliance
- [x] Audit logging on all mutating API calls
- [x] User, action, timestamp, IP logged
- [x] Compliance mapping (OWASP, NIST, PCI-DSS, ISO)
- [ ] SOC2 Type II audit trail (v2)
- [ ] Data retention policies (v2)

## Infrastructure
- [x] Docker containers (non-root user)
- [x] Kubernetes readiness & liveness probes
- [x] Horizontal Pod Autoscaler
- [x] Network policies (VPC private subnets)
- [x] RDS Multi-AZ for production
- [ ] WAF (Web Application Firewall) (v2)
- [ ] DDoS protection (v2)

## Monitoring
- [x] Prometheus service scraping
- [x] Health check endpoints on all services
- [ ] Grafana dashboards (v2)
- [ ] PagerDuty alerting integration (v2)
- [ ] ELK stack centralized logging (v2)
