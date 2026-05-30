# Docker + Traefik Production Setup

This stack runs frontend + backend + PostgreSQL behind Traefik with automatic Let's Encrypt HTTPS.

Traefik uses a file-based routing config (`deploy/traefik/dynamic.yml`) to avoid Docker API compatibility issues on some hosts.

- Frontend: `https://tailoredpsychology.com.au`
- Backend API: `https://api.tailoredpsychology.com.au`

## Prerequisites

- Docker and Docker Compose plugin installed on the droplet
- DNS records pointed to the droplet IP:
  - `A tailoredpsychology.com.au -> <droplet-ip>`
  - `A www.tailoredpsychology.com.au -> <droplet-ip>`
  - `A api.tailoredpsychology.com.au -> <droplet-ip>`
- Clone both repos as sibling directories

Example directory layout:

```text
/opt/clink/tailoredpsychology-backend
/opt/clink/tailoredpsychology-frontend
```

## 1) Prepare environment

```bash
cd /opt/clink/tailoredpsychology-backend/deploy
cp .env.example .env
```

Edit `.env` and set:

- `BASE_DOMAIN`
- `LETSENCRYPT_EMAIL`
- `FRONTEND_PATH` (relative to this `deploy` directory)
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL` (default points to local `postgres` container)
- `AUTH_JWT_SECRET`
- `COOKIE_DOMAIN` (set to `.yourdomain.com` so frontend + API subdomains can share role cookie)
- `CORS_ORIGINS` (optional; comma-separated `https://` site origins — defaults from `BASE_DOMAIN` if omitted)
- **Twilio Video (telehealth):** `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET` — see [Twilio Video setup](#7-twilio-video-telehealth) below
- optional scheduler settings

## 2) Start stack

```bash
docker compose --env-file .env -f docker-compose.traefik.yml up -d --build
```

## 3) Validate

```bash
docker compose --env-file .env -f docker-compose.traefik.yml ps
docker compose --env-file .env -f docker-compose.traefik.yml logs -f
```

Expected:

- Frontend responds on `https://<BASE_DOMAIN>`
- API responds on `https://api.<BASE_DOMAIN>/api/health`

## Local Postgres notes

- This setup persists database data in Docker volume `postgres_data`.
- Keep `DATABASE_URL` as `...@postgres:5432/...` to use the local container.
- If you ever move back to managed DB, just change `DATABASE_URL` to external host value.

## 4) Database migrations

After schema changes (e.g. patient mood check-ins):

```bash
docker compose --env-file .env -f docker-compose.traefik.yml exec backend npx prisma migrate deploy
```

## 7) Twilio Video (telehealth)

In-browser video calls use **Twilio Programmable Video**. The backend mints short-lived join tokens; the frontend connects with the Twilio Video SDK.

### Twilio Console setup

1. Sign in at [Twilio Console](https://console.twilio.com).
2. Copy **Account SID** from the dashboard (`AC...`).
3. Go to **Account → API keys & tokens → Create API key**.
4. Save the **API Key SID** (`SK...`) and **API Key Secret** (shown once).
5. Enable billing if required for Video on your account (trial accounts can test with limits).

### Server `.env`

In `deploy/.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_key_secret_here
```

Restart backend after changing credentials:

```bash
docker compose --env-file .env -f docker-compose.traefik.yml up -d --build backend
docker compose --env-file .env -f docker-compose.traefik.yml exec backend npm run verify:twilio
```

If `verify:twilio` fails, the three values do not belong together. Common mistakes:
- Using **Auth Token** in `TWILIO_API_SECRET` (must be **API Key Secret** from Create API key)
- Putting **Account SID** (`AC…`) in `TWILIO_API_KEY` (must be **API Key SID** `SK…`)
- Quotes or spaces in `.env` values (the backend strips quotes automatically)

### QA test users + session in 3 minutes

```bash
docker compose --env-file .env -f docker-compose.traefik.yml exec backend npm run seed:video-session-test
```

Default accounts: `video.patient@clink.test` / `video.psych@clink.test` — password `VideoTest123!`  
Session URL: `https://<BASE_DOMAIN>/video-session/appt_video_test`

## 5) Deploy updates

After pulling new commits in backend/frontend:

```bash
docker compose --env-file .env -f docker-compose.traefik.yml up -d --build
docker compose --env-file .env -f docker-compose.traefik.yml exec backend npx prisma migrate deploy
```

Traefik picks up `deploy/traefik/dynamic.yml` changes on file watch (no rebuild needed for routing-only edits). Restart Traefik if WebSocket chat still fails after deploy:

```bash
docker compose --env-file .env -f docker-compose.traefik.yml restart traefik backend frontend
```

Chat uses Socket.IO on `wss://api.<BASE_DOMAIN>/socket.io/` (namespace `/chat`). If you use Cloudflare in front of the droplet, enable **WebSockets** for the API hostname.

## 6) Staging smoke (Wave 20)

From the monorepo root on a machine that can reach staging:

```bash
API_BASE="https://api.tailoredpsychology.com.au/api" \
WEB_BASE="https://tailoredpsychology.com.au" \
CORS_ORIGIN="https://tailoredpsychology.com.au" \
SMOKE_PATIENT_EMAIL="<patient>" \
SMOKE_PATIENT_PASSWORD="<password>" \
# ... psychologist, manager, admin as needed ...
npm run smoke:wave20
```

See `frontend/docs/WAVE20_LAUNCH_CLOSURE_AND_STAGING.md` and `WAVE5_STAGING_SMOKE_PREP_CHECKLIST.md`.
