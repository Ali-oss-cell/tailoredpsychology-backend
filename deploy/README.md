# Docker + Traefik Production Setup

This stack runs both services behind Traefik with automatic Let's Encrypt HTTPS:

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
- `DATABASE_URL`
- `AUTH_JWT_SECRET`
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

## 4) Deploy updates

After pulling new commits in backend/frontend:

```bash
docker compose --env-file .env -f docker-compose.traefik.yml up -d --build
```
