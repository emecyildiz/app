# Environment Variables Kurulum Rehberi

## Sorun
Backend'de "supabaseUrl is required" hatası alıyorsunuz. Bu, environment variables'ların eksik olduğunu gösteriyor.

## Çözüm

### 1. Frontend Environment Variables (.env dosyası)

Proje root dizininde `.env` dosyası oluşturun:

```env
# Frontend Environment Variables
VITE_API_URL=https://app-production-c295.up.railway.app
VITE_APP_NAME=ratemet
VITE_APP_VERSION=1.0.0
VITE_APP_LOGO_URL=/brand/ratemet-logo.png
BACKEND_URL=https://app-production-c295.up.railway.app

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development
VITE_DEV_API_URL=http://localhost:5000
```

### 2. Backend Environment Variables (backend/.env dosyası)

`backend` klasöründe `.env` dosyası oluşturun:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CORS Configuration (Frontend URL)
CORS_ORIGIN=https://your-app.vercel.app
ALLOWED_ORIGIN=http://localhost:3001,https://app-eta-five-56.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Supabase Bilgilerini Alma

### 1. Supabase Dashboard'a Giriş
1. [Supabase.com](https://supabase.com) adresine gidin
2. Projenizi seçin
3. Sol menüden "Settings" > "API" seçin

### 2. Gerekli Bilgileri Not Edin
- **Project URL**: `https://your-project.supabase.co`
- **anon public key**: `your-anon-key`
- **service_role secret key**: `your-service-role-key`

### 3. Database Password Alma
1. Supabase Dashboard'da "Settings" > "Database" seçin
2. "Database password" bölümünden şifrenizi alın

## Environment Variables'ları Güncelleme

### Frontend (.env):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (backend/.env):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## Test Etme

### 1. Frontend Testi:
```bash
npm run dev
```

### 2. Backend Testi:
```bash
cd backend
npm start
```

### 3. Environment Variables Kontrolü:
```bash
# Frontend
echo $VITE_SUPABASE_URL

# Backend
cd backend
echo $SUPABASE_URL
```

## Güvenlik Notları

1. **Service Role Key**: Bu key'e çok dikkat edin, admin yetkileri verir
2. **Database Password**: Güçlü bir şifre kullanın
3. **JWT Secret**: Production'da güçlü bir secret kullanın
4. **Environment Files**: `.env` dosyalarını git'e commit etmeyin

## Sorun Giderme

### Hata: "supabaseUrl is required"
**Çözüm:** `SUPABASE_URL` environment variable'ını kontrol edin

### Hata: "supabaseAnonKey is required"
**Çözüm:** `SUPABASE_ANON_KEY` environment variable'ını kontrol edin

### Hata: "Database connection failed"
**Çözüm:** `DATABASE_URL` ve password'ü kontrol edin

### Hata: "CORS error"
**Çözüm:** `ALLOWED_ORIGIN` ve `CORS_ORIGIN` değerlerini kontrol edin

## Production Deployment

### Railway (Backend):
Railway Dashboard'da environment variables ekleyin:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`

### Vercel (Frontend):
Vercel Dashboard'da environment variables ekleyin:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

## Kontrol Listesi

- [ ] Frontend .env dosyası oluşturuldu
- [ ] Backend .env dosyası oluşturuldu
- [ ] Supabase URL doğru
- [ ] Supabase Anon Key doğru
- [ ] Supabase Service Role Key doğru
- [ ] Database URL doğru
- [ ] Frontend çalışıyor
- [ ] Backend çalışıyor
- [ ] Database bağlantısı çalışıyor

## Notlar

- Environment variables'ları değiştirdikten sonra uygulamayı yeniden başlatın
- Production'da environment variables'ları platform dashboard'larında ayarlayın
- Development'ta .env dosyalarını kullanın
- Güvenlik için sensitive bilgileri git'e commit etmeyin
