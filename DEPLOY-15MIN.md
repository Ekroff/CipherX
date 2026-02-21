# Complete deployment in ~15 minutes

Get the CipherX frontend (Vercel) + API (backend) live so signup and auth work on the deployed site.

## What you need

- GitHub repo connected to Vercel (frontend already deploys)
- A free [Supabase](https://supabase.com) account (for PostgreSQL)
- A free [Render](https://render.com) account (for API Gateway + Auth service), or [Railway](https://railway.app)

---

## Step 1: Database (Supabase) — ~3 min

1. Go to [supabase.com](https://supabase.com) → New project → pick org, name, password, region.
2. Wait for the project to be ready.
3. **Settings → Database** → copy the **Connection string** (URI). Use “URI” and the password you set.  
   Example: `postgresql://postgres:YOUR_PASSWORD@db.xxxx.supabase.co:5432/postgres`
4. In **Settings → API** note the **Project URL** and **anon** key if you use Supabase client later.

For CipherX auth you need the **Postgres connection**. Set these env vars (used in Step 2):

- `DB_HOST` = host from URI (e.g. `db.xxxx.supabase.co`)
- `DB_PORT` = `5432`
- `DB_NAME` = `postgres`
- `DB_USER` = `postgres`
- `DB_PASSWORD` = your DB password
- `DB_SSL` = `true`

---

## Step 2: Backend on Render (API Gateway + Auth) — ~5 min

Render can run two services from the same repo: Auth and API Gateway.

### 2a: Auth service

1. **Render Dashboard** → New → **Web Service**.
2. Connect your GitHub repo, branch `main`.
3. Settings:
   - **Name:** `cipherx-auth`
   - **Root Directory:** leave empty (monorepo root).
   - **Build Command:** `npm install && npm run build --workspace=packages/common && npm run build --workspace=packages/auth-service`
   - **Start Command:** `node packages/auth-service/dist/index.js`
   - **Instance type:** Free.
4. **Environment** → Add:
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` from Step 1.
   - `JWT_SECRET` = a long random string (e.g. `openssl rand -hex 32`).
5. Create Web Service. Note the URL, e.g. `https://cipherx-auth.onrender.com`.

### 2b: API Gateway

1. **New → Web Service** → same repo.
2. Settings:
   - **Name:** `cipherx-api`
   - **Build Command:** `npm install && npm run build --workspace=packages/common && npm run build --workspace=packages/api-gateway`
   - **Start Command:** `node packages/api-gateway/dist/index.js`
   - **Instance type:** Free.
3. **Environment** → Add:
   - `PORT` = `3000`
   - `AUTH_SERVICE_URL` = `https://cipherx-auth.onrender.com` (your auth service URL from 2a)
   - `CORS_ORIGIN` = your Vercel frontend URL, e.g. `https://cipher-x-gamma.vercel.app`
   - `JWT_SECRET` = **same value** as in the auth service.
   - Same `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` as in the auth service (gateway uses them for audit logging).
4. Create Web Service. Note the URL, e.g. `https://cipherx-api.onrender.com`.

The gateway exposes the API at **`https://cipherx-api.onrender.com/api/v1`** (no trailing slash).

---

## Step 3: Point frontend to the API (Vercel) — ~2 min

1. **Vercel** → your project → **Settings → Environment Variables**.
2. Add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://cipherx-api.onrender.com/api/v1` (your API Gateway URL from Step 2b)
   - Apply to Production (and Preview if you want).
3. **Redeploy:** Deployments → … on latest → **Redeploy** (so the new env var is baked into the build).

---

## Step 4: Database schema (one-time)

The auth service expects `organizations`, `users`, and `audit_logs` tables.

1. In Supabase **SQL Editor**, run the full schema: open **packages/database/schema.sql** in your repo, copy its contents, and execute in the SQL Editor.
2. That creates all tables and enums. Without this step, signup will fail with a database error.

---

## Checklist

- [ ] Supabase project created; `DB_*` and `DB_SSL` set for auth.
- [ ] Auth service deployed on Render; `JWT_SECRET` and `DB_*` set.
- [ ] API Gateway deployed on Render; `AUTH_SERVICE_URL`, `CORS_ORIGIN`, and same `JWT_SECRET` set.
- [ ] `VITE_API_BASE_URL` set in Vercel and frontend redeployed.
- [ ] DB schema (tables) applied in Supabase if needed.

After that, open your Vercel app and try signup; the request should go to your Render API Gateway → Auth service → Supabase.
