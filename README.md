# Ratemet

Film puanlama ve keşif platformu. Kullanıcılar film puanlayabilir, favori listelerini yönetebilir, arkadaşlarına film önerebilir ve TMDB API'den popüler, yeni ve en iyi filmleri keşfedebilir.

## Özellikler
- Supabase ile kullanıcı kimlik doğrulama (email/şifre, OTP)
- Popüler/yeni/en iyi filmleri görüntüleme
- Oyuncu kadrosu, video ve görseller ile detaylı film bilgileri
- Favoriler, puanlama ve yorum sistemi
- Arkadaşlık ve film öneri sistemi
- Admin/moderatör yönetim paneli

## Teknoloji Stack
- **Frontend:** React, Vite, Tailwind CSS, Zustand
- **Backend:** Node.js (Express), Supabase (PostgreSQL + Auth)
- **Harici API:** TMDB (The Movie Database)

## Proje Yapısı
```
app/
├── src/              # Frontend React uygulaması
├── backend/          # Express API sunucusu
└── public/           # Statik dosyalar
```

## Gereksinimler
- Node.js 18+
- Supabase projesi (URL ve anahtarlar)
- TMDB API anahtarı

## Kurulum

### 1. Bağımlılıkları Yükleyin

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

### 2. Environment Değişkenlerini Ayarlayın

**Frontend (.env)** - Proje kök dizininde:
```env
# Uygulama Bilgileri
VITE_APP_NAME=Ratemet
VITE_APP_LOGO_URL=/brand/ratemet-logo.png

# Supabase Ayarları
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API
VITE_API_URL=http://localhost:8080

# Activity Tracking
VITE_ACTIVITY_TRACKING_ENABLED=true
```

**Backend (backend/.env):**
```env
# Server Ayarları
PORT=8080
ALLOWED_ORIGIN=http://localhost:3001,http://localhost:3002
NODE_ENV=development

# Supabase Ayarları
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database
DATABASE_URL=postgresql://user:password@host:5432/postgres

# TMDB API
TMDB_API_KEY=your-tmdb-api-key
TMDB_V4_TOKEN=your-v4-token
TMDB_API_BASE_URL=https://api.themoviedb.org/3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

> **Not:** `.env.example` ve `backend/.env.example` dosyalarını referans alabilirsiniz.

## Çalıştırma

### Development Modu

**Frontend (Port 3001):**
```bash
npm run dev
```

**Backend (Port 8080):**
```bash
cd backend
npm run dev
```

veya ayrı terminal'de:
```bash
npm run backend
```

### Production Modu

**Frontend Build:**
```bash
npm run build
npm run preview
```

**Backend Start:**
```bash
cd backend
npm start
```

## API Endpoints

Backend varsayılan olarak `http://localhost:8080` adresinde çalışır:

- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Kayıt
- `GET /api/movies` - Film listesi
- `POST /api/ratings` - Film puanlama
- `GET /api/recommendations` - Öneriler
- Ve daha fazlası...

## Veritabanı Kurulumu

1. Supabase Dashboard'a gidin
2. SQL Editor'da `templates/` klasöründeki SQL şemalarını çalıştırın
3. RLS (Row Level Security) politikalarının aktif olduğundan emin olun

## Önemli Notlar

⚠️ **Güvenlik:**
- Gerçek API anahtarlarını asla commit etmeyin
- `.env` dosyaları `.gitignore`'da olmalı
- Production'da güçlü şifreler kullanın

## Canli (Production) Ortam

### Vercel (Frontend)

**Environment Variables:**
```env
VITE_API_URL=https://<render-servis-adi>.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Ratemet
VITE_APP_LOGO_URL=/brand/ratemet-logo.svg
VITE_TMDB_API_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_LANGUAGE=tr-TR
VITE_HTTP_TIMEOUT_MS=10000
VITE_ACTIVITY_TRACKING_ENABLED=true
```

> Not: Rate limit ayarlari frontend icin degil, backend icindir.

### Render (Backend)

**Environment Variables:**
```env
NODE_ENV=production
PORT=8080
ALLOWED_ORIGIN=https://<vercel-proje-adi>.vercel.app
DATABASE_URL=postgresql://user:password@host:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
TMDB_API_KEY=your-tmdb-api-key
TMDB_V4_TOKEN=your-v4-token
TMDB_API_BASE_URL=https://api.themoviedb.org/3
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

📚 **Veri Kaynağı:**
- Tüm film verileri TMDB API'den gelir
- TMDB API anahtarı ücretsiz olarak edinilebilir: https://www.themoviedb.org/settings/api

🔧 **Development:**
- Frontend otomatik olarak yeniden yüklenir (Hot Reload)
- Backend nodemon ile değişiklikleri izler
- Her iki servisi de aynı anda çalıştırın

## Lisans
MIT
