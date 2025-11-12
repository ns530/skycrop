# SkyCrop — Implementation Phase (MVP)

Satellite-Based Paddy Field Management & Monitoring System

This repository contains the MVP implementation scaffolding for the SkyCrop platform, aligned to the approved SRS/HLD/LLD/SDD. Phase 1 is delivered as a modular monolith with a Node.js backend, and a separate Python ML service planned in later sprints. This README documents how to set up, run, and verify the system during development.

## Architecture (MVP)

- Backend API (Node.js/Express)
  - PostgreSQL + PostGIS (relational + spatial)
  - Redis (cache + rate limiting + token blacklist + temp tokens)
  - MongoDB (for content/analytics in later sprints)
  - AuthN/AuthZ: JWT + Google OAuth
- API Docs: OpenAPI 3.1 spec
- CI: GitHub Actions (lint + tests + coverage)
- Containerized Datastores via Docker Compose

Key files:
- Backend server: backend/src/server.js
- Express app: backend/src/app.js
- Database (Sequelize): backend/src/config/database.config.js
- Redis client: backend/src/config/redis.config.js
- Passport (Google OAuth): backend/src/config/passport.config.js
- User model: backend/src/models/user.model.js
- Auth service: backend/src/services/auth.service.js
- Auth controller: backend/src/api/controllers/auth.controller.js
- Auth routes: backend/src/api/routes/auth.routes.js
- Middleware (JWT/RBAC): backend/src/middleware/auth.middleware.js
- OpenAPI spec: backend/src/api/openapi.yaml
- Database init (PostgreSQL): backend/database/init.sql
- Docker Compose: docker-compose.yml
- CI workflow: .github/workflows/backend-ci.yml

## Prerequisites

- Node.js 20.x
- Docker + Docker Compose
- Git
- Optional: curl or Postman/Insomnia for API testing

## Quick Start

1) Start databases and cache via Docker Compose:
- docker-compose.yml

```bash
docker compose up -d
# Services:
# - Postgres (with PostGIS): localhost:5432
# - MongoDB: localhost:27017
# - Redis: localhost:6379
```

2) Backend environment
- backend/.env.example → copy to backend/.env and adjust as needed

```bash
cd backend
cp .env.example .env
```

Minimum required envs for local auth testing:
```ini
PORT=3000
NODE_ENV=development
JWT_SECRET=dev-secret-change-me
DB_HOST=localhost
DB_PORT=5432
DB_NAME=skycrop_dev
DB_USER=skycrop_user
DB_PASSWORD=skycrop_pass
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

For Google OAuth (optional at first), set:
```ini
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
OAUTH_CALLBACK=/api/v1/auth/google/callback
```

3) Install backend dependencies and run the API

```bash
cd backend
npm ci
npm run dev        # starts on http://localhost:3000
```

4) Verify health

```bash
curl http://localhost:3000/health
# { "status": "ok", "service": "skycrop-backend", ... }
```

## Database Initialization

The Postgres container runs backend/database/init.sql automatically through the docker-entrypoint. If you need to re-run manually (e.g., local psql):

```bash
psql -h localhost -U skycrop_user -d skycrop_dev -f backend/database/init.sql
```

## API Overview

- OpenAPI 3.1: backend/src/api/openapi.yaml

Base URL (local): http://localhost:3000

- Health
  - GET /health
- Authentication (v1)
  - POST /api/v1/auth/signup
  - POST /api/v1/auth/login
  - POST /api/v1/auth/logout
  - GET  /api/v1/auth/verify-email?token=...
  - POST /api/v1/auth/request-password-reset
  - POST /api/v1/auth/reset-password
  - GET  /api/v1/auth/google
  - GET  /api/v1/auth/google/callback

Example requests:

Signup
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"Password1","name":"Farmer"}'
```

Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer@example.com","password":"Password1"}'
```

Logout
```bash
TOKEN="eyJhbGciOi..."
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

Email verify
```bash
curl "http://localhost:3000/api/v1/auth/verify-email?token=YOUR_TOKEN"
```

## Testing

Unit and integration tests (Jest + Supertest):

```bash
cd backend
npm run test           # run tests
npm run test:coverage  # with coverage report
```

Notes:
- Redis is mocked for tests (no external connections)
- User model is mocked in tests for fast, isolated runs
- CI workflow: .github/workflows/backend-ci.yml (starts Postgres + Redis for pipeline)

## Linting & Formatting

```bash
cd backend
npm run lint
npm run format
```

Rules:
- ESLint (Airbnb base + Prettier)
- Prettier for code style

## Project Structure (current)

```
.
├── README.md
├── docker-compose.yml
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── jest.config.js
│   ├── database/
│   │   └── init.sql
│   └── src/
│       ├── server.js
│       ├── app.js
│       ├── config/
│       │   ├── database.config.js
│       │   ├── redis.config.js
│       │   └── passport.config.js
│       ├── models/
│       │   └── user.model.js
│       ├── errors/
│       │   └── custom-errors.js
│       ├── middleware/
│       │   └── auth.middleware.js
│       ├── services/
│       │   └── auth.service.js
│       └── api/
│           ├── controllers/
│           │   └── auth.controller.js
│           ├── routes/
│           │   └── auth.routes.js
│           └── openapi.yaml
└── .github/
    └── workflows/
        └── backend-ci.yml
```

## Dev Tips

- If you change Sequelize model timestamps/underscored options, ensure alignment to DB schema (created_at/updated_at).
- JWT secrets: use strong 256-bit random key in production.
- Set CORS_ORIGIN and FRONTEND_URL appropriately once the frontend dev server is running.

## Roadmap Alignment (Sprint 1 excerpt)

Delivered in this MVP scaffold:
- Datastores via Docker Compose (Postgres+PostGIS, Redis, MongoDB placeholder)
- Backend API bootstrapped with health endpoint
- Authentication: Email+Password, JWT session, Redis-backed lockouts and blacklist
- Google OAuth endpoints wired (requires valid Google credentials)
- Unit & Integration tests for auth
- OpenAPI 3.1 spec for Health/Auth
- CI pipeline for backend (lint, test, coverage)

Upcoming Sprints (per implementation_roadmap.md):
- Field management service (GeoJSON boundary, area calculation)
- Satellite service integration (Sentinel Hub retrieval and caching)
- Health monitoring indices pipeline (NDVI/NDWI/TDVI)
- Recommendation engine and yield prediction service stubs (bridge to ML service)

## Troubleshooting

- Postgres not ready: docker logs skycrop-postgres; ensure db ports not in use.
- Redis connection errors: confirm REDIS_URL and container status.
- Google OAuth callback mismatch: ensure OAUTH_CALLBACK matches credentials console and FRONTEND_URL domain.

## License

For academic use within the SkyCrop project scope.
