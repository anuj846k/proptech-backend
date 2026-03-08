## Protech Backend – Docker & Local Setup

This document explains how to:

- **Run locally without Docker**
- **Run with Docker (dev & prod)**
- **Repopulate dev `node_modules` inside Docker** when dependencies change

---

## 1. Prerequisites

- **Node.js 22+**
- **pnpm** (via `corepack enable` or installed globally)
- **Docker** and **Docker Compose** (v2)
- A valid **`.env`** file in `backend/` with at least:
  - `DATABASE_URL`
  - `ACCESS_SECRET`
  - `REFRESH_SECRET`

> The `.env` file is NOT copied into images and is read at runtime.

---

## 2. Run locally (no Docker)

From `backend/`:

```bash
pnpm install
pnpm dev
```

App starts on **http://localhost:8000** using `nodemon` + `tsx` with hot reload.

For a local production-like run:

```bash
pnpm build
pnpm start   # runs node dist/index.js
```

---

## 3. Docker – Development (with live reload)

Dev stack (from `docker-compose.dev.yml`):

- `app` service built from `DockerFile.dev` (nodemon + tsx)
- `nginx` service as reverse proxy on host port **8000**
- Code mounted from your machine for live reload
- Separate Docker volume for `node_modules` so Linux binaries are used

> Note: `DockerFile.dev` runs `pnpm install --frozen-lockfile && pnpm run dev` on container start.  
> Dependencies are installed **inside the container** automatically when you run `docker compose up`.

### 3.1 Start dev stack

From `backend/`:

```bash
docker compose -f docker-compose.dev.yml up
```

Then open:

- **http://localhost:8000**

Behavior:

- `app` runs `pnpm run dev` (nodemon + tsx)
- Source code is live from your machine via `.:/app`
- `nginx` listens on host port **8000** and proxies to `app:8000`

### 3.2 Rebuild dev images (if DockerFile.dev or compose changed)

```bash
docker compose -f docker-compose.dev.yml up --build
```

### 3.3 Stop dev stack

- Press **Ctrl+C** in the terminal where `up` is running, then optionally:

```bash
docker compose -f docker-compose.dev.yml down
```

---

## 4. Docker – Production (compiled app + nginx)

Prod stack (from `docker-compose.prod.yml`):

- `app` service built from `DockerFile`
  - Installs dependencies
  - Runs `pnpm run build` to produce `dist/`
  - Prunes dev dependencies
  - Runs `node dist/index.js`
- `nginx` service on host port **80**, reverse-proxying to `app:8000`

### 4.1 Start prod stack (foreground)

From `backend/`:

```bash
docker compose -f docker-compose.prod.yml up --build
```

Then open:

- **http://localhost** (host port 80 → nginx → app:8000)

### 4.2 Start prod stack (background)

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

To stop:

```bash
docker compose -f docker-compose.prod.yml down
```

---

## 5. When to use which

- **Local dev (no Docker)**: fastest feedback, `pnpm dev`
- **Docker dev**: test the app inside containers with nginx and live reload
- **Docker prod**: validate the production image + nginx configuration locally (same pattern you’d run in staging/production)

---

## 6. Deploy to EC2 (GitHub Actions)

The workflow in `.github/workflows/deploy.yml` runs on **push to `main`** (or manually via “Run workflow”). It rsyncs the backend to EC2 and runs `docker compose -f docker-compose.prod.yml up -d --build`.

**One-time setup on EC2**

- Docker and Docker Compose installed
- Domain and Certbot configured (e.g. `/etc/letsencrypt` for `prop-tech.live` / `api.prop-tech.live`)
- A deploy directory created, e.g. `mkdir -p /home/ec2-user/proptech-backend`
- A **`.env`** file in that directory (same variables as `.env.example`); the workflow does **not** overwrite `.env`

**GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Example | Description |
|--------|--------|-------------|
| `EC2_HOST` | `api.prop-tech.live` or EC2 public IP | SSH host |
| `EC2_USER` | `ec2-user` (Amazon Linux) or `ubuntu` | SSH user |
| `EC2_SSH_PRIVATE_KEY` | Contents of your `.pem` key | Private key for SSH |
| `EC2_DEPLOY_PATH` | `/home/ec2-user/proptech-backend` | Absolute path to the app on EC2 |

First run: ensure `.env` exists at `EC2_DEPLOY_PATH` on the server before triggering the workflow.

