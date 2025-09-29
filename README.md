# ratemet

A social movie rating and discovery app. Users can rate movies, manage favorites, share recommendations with friends, and explore popular, latest, and top-rated titles fetched from the TMDB API.

## Features
- User authentication via Supabase (email/password, OTP flows)
- Browse popular/latest/top-rated movies
- Movie details with cast, videos, and images
- Favorites, ratings, comments
- Friendships and recommendations between users
- Admin/operator views (basic)

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, Zustand
- Backend: Node.js (Express), Supabase (Postgres + Auth)
- External API: TMDB

## Monorepo Layout
- `src/`: Frontend app
- `backend/`: Express API server

## Prerequisites
- Node.js 18+
- Supabase project (URL, keys)
- TMDB API key

## Environment Variables
Create two files with the following placeholders and fill your own values.

Frontend (`.env` at repo root or Vercel project envs):
```env
VITE_API_URL=https://your-backend.example.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_TMDB_API_KEY=your-tmdb-api-key
VITE_TMDB_API_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_LANGUAGE=tr-TR
VITE_HTTP_TIMEOUT_MS=10000
```

Backend (`backend/.env` or Railway project envs):
```env
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TMDB_API_KEY=your-tmdb-api-key
# Example pooler connection string (replace placeholders)
DATABASE_URL=postgresql://<user>:<password>@<host>:6543/postgres
ALLOWED_ORIGIN=https://your-frontend.example.com
PORT=8080
```

Do NOT commit real secrets. Use project settings in Vercel/Railway to store env vars securely.

## Install & Run
Frontend:
```bash
npm install
npm run dev
```

Backend:
```bash
cd backend
npm install
npm start
```

## Deployment
- Frontend: Vercel (see `vercel.json`)
- Backend: Railway (see `railway.json`)

Set all environment variables in each platform’s dashboard before deploying.

## Notes
- All film data comes from TMDB; no mock data is shipped.
- Ensure RLS policies in Supabase are configured appropriately.
- Rotate keys immediately if any secret is ever exposed in git history.