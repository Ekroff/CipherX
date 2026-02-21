# CipherX – Cryptographic Bill of Materials & Remediation Engine

> Enterprise-grade SaaS platform for cryptographic vulnerability scanning, AI-powered risk analysis, CI/CD enforcement, and compliance reporting.

**Repository:** [https://github.com/Ekroff/CipherX](https://github.com/Ekroff/CipherX)

![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## 🏗️ Architecture Overview

CipherX is a modular microservices platform built with Node.js/TypeScript:

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 3000 | Unified entry point, JWT auth, rate limiting, routing |
| **Auth Service** | 3001 | User registration, login, JWT (access+refresh), RBAC |
| **Scanner Service** | 3002 | CBOM Discovery Engine – AST-based crypto scanning |
| **Risk Engine** | 3003 | AI-powered risk analysis via OpenAI GPT-4o |
| **Remediation Service** | 3004 | AI-generated secure code replacements |
| **Gatekeeper Service** | 3005 | CI/CD webhook integration, PR blocking |
| **Compliance Service** | 3006 | OWASP/NIST/PCI-DSS/ISO mapping, PDF/CSV export |

### Infrastructure
- **PostgreSQL 16** – Structured data (12 tables)
- **Redis 7** – Caching, job queues
- **ElasticSearch 8** – Searchable vulnerability indexing
- **MinIO** – S3-compatible object storage

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- OpenAI API key

### 1. Setup
```bash
# Clone and install
git clone https://github.com/Ekroff/CipherX.git
cd CipherX
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

npm install
```

### 2. Start Infrastructure
```bash
docker compose up -d
```

### 3. Run Services (Development)
```bash
npm run dev
```

### 4. Access
- **API Gateway**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

---

## Deploying to Vercel (frontend)

The frontend is in **packages/frontend** (not in the database package). To deploy it:

1. **Set Root Directory**  
   In the Vercel project: **Settings → General → Root Directory** → set to `packages/frontend`. This makes Vercel use that package as the project root (its `vercel.json` and `npm run build`).

2. **Node version**  
   The repo root has an `.nvmrc` with `20`; Vercel will use Node 20 when building.

3. **If you keep Root Directory at repo root**  
   Use the root `vercel.json` as-is: build command `npm run build --workspace=packages/frontend`, output directory `packages/frontend/dist`.

4. **If the build fails**  
   Paste the **full error** from the Vercel build log (or your local build) into `build_output.txt` in the repo root so it can be used to fix the issue.

5. **Windows: EPERM / "operation not permitted" during `npm install`**  
   If install fails or warns about unlinking `esbuild.exe`, either close other Node processes and run `npm install` again, or use the safe build script so stderr doesn't abort the run:  
   `npm run build:frontend:safe` (runs install + frontend build without PowerShell treating npm stderr as a failure).

---

## 📡 API Reference

All endpoints require JWT auth (except `/api/v1/auth/*`).

### Authentication
```
POST /api/v1/auth/register   – Register new account
POST /api/v1/auth/login      – Login, receive tokens
POST /api/v1/auth/refresh    – Refresh access token
GET  /api/v1/auth/me         – Get current user profile
```

### Repository Management
```
POST /api/v1/repos/connect   – Connect a repository
GET  /api/v1/repos           – List repositories
```

### Scanning
```
POST /api/v1/scan/start      – Start a crypto scan
GET  /api/v1/scan/:id/status – Check scan status
GET  /api/v1/findings        – List findings (filterable)
```

### AI Analysis
```
POST /api/v1/ai/risk         – AI risk analysis
POST /api/v1/ai/remediate    – AI code remediation
```

### Compliance
```
GET  /api/v1/compliance/report    – Compliance report
GET  /api/v1/compliance/export    – Export PDF/CSV
GET  /api/v1/compliance/dashboard – Executive dashboard
```

### CI/CD Integration
```
POST /api/v1/integrations/github  – GitHub webhook
POST /api/v1/integrations/gitlab  – GitLab webhook
POST /api/v1/gatekeeper/evaluate  – Evaluate scan results
```

---

## 🔎 Supported Languages

| Language | Parser | Detections |
|----------|--------|-----------|
| JavaScript/TypeScript | Babel AST | crypto.*, CryptoJS, TLS config |
| Python | Pattern-based | hashlib, PyCrypto, cryptography |
| Java | Pattern-based | javax.crypto, MessageDigest, SSLContext |
| Go | Pattern-based | crypto/*, tls.Config |

### Detections
- ❌ Weak algorithms (MD5, SHA-1, DES, RC4, 3DES)
- ❌ Hardcoded keys/secrets
- ❌ Static IV/nonce usage
- ❌ Unsalted password hashing
- ❌ Weak RSA key lengths (< 2048 bits)
- ❌ Deprecated TLS versions (< 1.2)
- ❌ Insecure cipher modes (ECB)

---

## 🔐 RBAC Roles

| Role | Permissions |
|------|------------|
| **Developer** | View findings, trigger scans |
| **Security Analyst** | All developer + risk analysis, remediation |
| **CISO** | All analyst + compliance reports, dashboard |
| **Auditor** | Read-only access to all data + audit logs |
| **Admin** | Full platform access |

---

## 💎 Pricing Tiers

| Tier | Repos | Scans/mo | AI Calls | CI/CD | Compliance |
|------|-------|----------|----------|-------|------------|
| Free | 1 | 10 | 5 | ❌ | ❌ |
| Pro | 10 | 100 | 50 | ✅ | Basic |
| Enterprise | ∞ | ∞ | 500 | ✅ | Full + Export |
| API-Only | N/A | Pay-per-scan | Pay-per-call | ❌ | API access |

---

## 🚢 Deployment

### Development
```bash
docker compose up -d
```

### Production (Kubernetes)
```bash
kubectl apply -f infrastructure/k8s/
```

### Infrastructure (Terraform)
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

---

## 📂 Project Structure

The **frontend** lives in `packages/frontend` (inside the `packages` folder, alongside other packages—not inside database).

```
CipherX/
├── packages/
│   ├── common/              # Shared types, constants, utils
│   ├── database/            # PostgreSQL schema
│   ├── auth-service/        # JWT + RBAC
│   ├── scanner-service/     # CBOM Discovery Engine
│   ├── risk-engine/         # AI Risk Analysis
│   ├── remediation-service/ # AI Code Remediation
│   ├── gatekeeper-service/  # CI/CD Gatekeeper
│   ├── compliance-service/  # Compliance & Reporting
│   ├── api-gateway/         # Unified API Gateway
│   └── frontend/            # UI app (packages/frontend, not in database)
├── infrastructure/
│   ├── k8s/                 # Kubernetes manifests
│   ├── terraform/           # AWS IaC
│   └── monitoring/          # Prometheus config
├── docker-compose.yml
├── package.json
└── tsconfig.base.json
```

---

## 📝 License

Proprietary – CipherX Team
