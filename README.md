# Ratemet

Ratemet is a self-hosted movie discovery and social catalog application. Users can browse TMDB data, rate and comment on movies, maintain favorites and watch history, connect with other users, and exchange recommendations.

## Architecture

- React 18 and Vite frontend
- Express 4 API
- Self-hosted PostgreSQL 16
- Cookie-based server sessions with CSRF protection
- TMDB requests proxied by the backend so browser clients never receive the API credential
- Resend-compatible transactional account email service

Supabase, Vercel, and Render are not runtime dependencies.

## Local development

Requirements: Node.js 18 or newer and Docker Desktop.

1. Copy `.env.example` to `.env`.
2. Copy `backend/.env.example` to `backend/.env` and replace every placeholder secret.
3. Start PostgreSQL from the repository root:

   ```powershell
   docker compose -f docker-compose.dev.yml up -d
   ```

4. Install packages and run the database migrations:

   ```powershell
   npm install
   Set-Location backend
   npm install
   npm run db:migrate
   ```

5. Run the API and frontend in separate terminals:

   ```powershell
   npm run backend
   npm run dev
   ```

The default frontend is `http://localhost:5173`; the API is `http://localhost:8080`; local PostgreSQL is exposed only on `127.0.0.1:5434`.

## Required backend configuration

- `DATABASE_URL`: PostgreSQL connection string
- `IP_HASH_SECRET`: long random secret used to pseudonymize IP addresses
- `TMDB_V4_TOKEN` or `TMDB_API_KEY`: server-side TMDB credential
- `ALLOWED_ORIGIN`: comma-separated browser origins allowed to call the API
- `APP_BASE_URL`: public frontend URL used in account emails
- `SESSION_COOKIE_NAME`, `SESSION_TTL_DAYS`, and `AUTH_REQUIRE_EMAIL_VERIFICATION`
- `RESEND_API_KEY` and `EMAIL_FROM` when account email delivery is enabled

See `backend/.env.example` for the full list. Never commit `.env` files or production secrets.

## Verification

```powershell
npm run build
docker compose -f docker-compose.test.yml up -d
$env:DATABASE_URL='postgresql://ratemet:integration-test-only@127.0.0.1:55434/ratemet'
Set-Location backend
npm run db:migrate
$env:TEST_DATABASE_URL=$env:DATABASE_URL
npm test
Set-Location ..
docker compose -f docker-compose.test.yml down -v
Set-Location backend
npm audit --omit=dev
```

The integration test truncates its target database. Always use the disposable database from `docker-compose.test.yml`; never point `TEST_DATABASE_URL` at development or production. The suite covers registration, login, session and CSRF handling, profile privacy, profile updates, favorites, ratings, watch history, comments, friendships, recommendations, logout, and password reset.

## Deployment direction

Production deployment uses the repository's `docker-compose.prod.yml` with three isolated services: PostgreSQL, the Express API, and a Caddy-hosted frontend gateway. The Ratemet gateway joins only the dedicated `ratemet-edge` network. The Cloudflare Tunnel container joins that network separately; the portfolio gateway remains on `emecworks-edge` and cannot directly reach Ratemet.

See `deploy/README.md` and `env.production.example` for the VPS procedure, Cloudflare Tunnel route, secrets, backup, restore, and hosted-service retirement checklist. Do not remove the previous hosted data source until export/import verification and rollback testing are complete.
