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
- optional Twilio and scheduler settings

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

## 4) Deploy updates

After pulling new commits in backend/frontend:

```bash
docker compose --env-file .env -f docker-compose.traefik.yml up -d --build
```
