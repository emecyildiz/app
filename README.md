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
Set-Location backend
npm test
npm audit --omit=dev
```

The integration test uses the local PostgreSQL database and covers registration, login, session and CSRF handling, profile updates, favorites, ratings, watch history, comments, friendships, recommendations, logout, and password reset.

## Deployment direction

Production deployment is intended for Docker on the Emecworks VPS behind its existing reverse proxy and Cloudflare routing. The production PostgreSQL database must use a persistent volume and independent encrypted backups. Do not remove the previous hosted data source until export/import verification and rollback testing are complete.
