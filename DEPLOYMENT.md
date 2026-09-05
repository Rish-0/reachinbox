# 🚀 Deployment Guide — ReachInbox.ai

This guide covers 3 production deployment paths for the ReachInbox monorepo:

1. **Option A: Single VPS (DigitalOcean / AWS EC2 / Hetzner)** *(Recommended for simplicity)*
2. **Option B: Render / Railway (Fully Managed Cloud)**
3. **Option C: Vercel (Frontend) + Railway (Backend API & Worker)**

---

## Option A: Single VPS Deployment (DigitalOcean / AWS / Hetzner)

Deploy the full stack with 1 command using `docker-compose.prod.yml`.

### Prerequisites
- A Ubuntu / Debian server (AWS EC2, DigitalOcean Droplet, Hetzner, etc.)
- Docker & Docker Compose installed (`sudo apt update && sudo apt install -y docker.io docker-compose-plugin`)

### Steps

1. **Clone repository on your server**:
   ```bash
   git clone https://github.com/your-username/reachinbox.git
   cd reachinbox
   ```

2. **Configure production environment variables**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Set your production URLs, secret keys, and database passwords:
   ```env
   DATABASE_URL="postgresql://reachinbox:your_secure_password@postgres:5432/reachinbox?schema=public"
   REDIS_URL="redis://redis:6379"
   SESSION_SECRET="generate-a-64-character-random-key"
   FRONTEND_URL="https://your-domain.com"
   API_URL="https://api.your-domain.com"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

3. **Deploy with Production Docker Compose**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Run Database Migrations**:
   ```bash
   docker compose -f docker-compose.prod.yml exec api npm run db:push
   ```

5. **Verify Running Services**:
   - Web App: `http://<your-server-ip>:3000`
   - API: `http://<your-server-ip>:4000`
   - Worker Health: `http://<your-server-ip>:4001`
   - Bull Board Queue UI: `http://<your-server-ip>:4000/admin/queues`

---

## Option B: Render / Railway Deployment

### 1. Database & Cache
- **PostgreSQL**: Provision a Managed PostgreSQL database on Railway / Render / Supabase / Neon. Copy the `DATABASE_URL`.
- **Redis**: Provision a Managed Redis database on Railway / Upstash / Render. Copy the `REDIS_URL`.

### 2. Deploy Services

#### A. Web API Service (`apps/api`)
- **Type**: Web Service
- **Build Command**: `npm run build -w packages/shared && npm run db:generate -w apps/api && npm run build -w apps/api`
- **Start Command**: `npm run start -w apps/api`
- **Environment Variables**:
  - `DATABASE_URL` = `<your-postgres-url>`
  - `REDIS_URL` = `<your-redis-url>`
  - `SESSION_SECRET` = `<random-secret-key>`
  - `FRONTEND_URL` = `https://your-frontend-app.onrender.com`
  - `API_URL` = `https://your-api-app.onrender.com`

#### B. Worker Service (`apps/worker`)
- **Type**: Background Worker
- **Build Command**: `npm run build -w packages/shared && npm run db:generate -w apps/api && npm run build -w apps/worker`
- **Start Command**: `npm run start -w apps/worker`
- **Environment Variables**:
  - `DATABASE_URL` = `<your-postgres-url>`
  - `REDIS_URL` = `<your-redis-url>`

#### C. Next.js Frontend (`apps/web`)
- **Type**: Web Service
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build -w packages/shared && npm run build -w apps/web`
- **Start Command**: `npm run start -w apps/web`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL` = `https://your-api-app.onrender.com`

---

## Option C: Vercel (Frontend) + Railway (Backend & Worker)

### 1. Frontend on Vercel
1. Import repository on Vercel.
2. Set Root Directory to `apps/web`.
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://api-production.up.railway.app`
4. Deploy!

### 2. Backend & Worker on Railway
1. Click **New Project** → **Deploy from GitHub repo**.
2. Add PostgreSQL and Redis plugins.
3. Add **API Service** (`apps/api`) and **Worker Service** (`apps/worker`).
4. Set `FRONTEND_URL` = `https://your-app.vercel.app`.
