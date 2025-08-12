# Supabase Kurulum Rehberi

Bu rehber, ratemet projenizi Supabase ile entegre etmek için adım adım talimatları içerir.

## 1. Supabase Projesi Oluşturma

### 1.1 Supabase Hesabı
1. [Supabase.com](https://supabase.com) adresine gidin
2. GitHub ile giriş yapın
3. "New Project" butonuna tıklayın

### 1.2 Proje Ayarları
- **Organization**: Kendi organizasyonunuzu seçin
- **Name**: `cinemahub` (veya istediğiniz bir isim)
- **Database Password**: Güçlü bir şifre belirleyin (unutmayın!)
- **Region**: Size en yakın bölgeyi seçin
- **Pricing Plan**: Free tier ile başlayın

### 1.3 Proje Oluşturma
- "Create new project" butonuna tıklayın
- Proje oluşturulmasını bekleyin (2-3 dakika)

## 2. Veritabanı Kurulumu

### 2.1 SQL Editor'a Erişim
1. Supabase Dashboard'da projenizi açın
2. Sol menüden "SQL Editor" seçin
3. "New query" butonuna tıklayın

### 2.2 Migration Dosyasını Çalıştırma
1. `backend/supabase-migration.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. "Run" butonuna tıklayın

### 2.3 Tabloları Kontrol Etme
1. Sol menüden "Table Editor" seçin
2. Şu tabloların oluştuğunu kontrol edin:
   - `users`
   - `movies`
   - `ratings`
   - `favorites`

## 3. Environment Variables Ayarlama

### 3.1 Supabase Bilgilerini Alma
1. Supabase Dashboard'da "Settings" > "API" bölümüne gidin
2. Şu bilgileri not edin:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: `your-anon-key`
   - **service_role secret key**: `your-service-role-key`

### 3.2 Backend Environment Variables
`backend/.env` dosyası oluşturun:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

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

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.3 Frontend Environment Variables
Proje root dizininde `.env` dosyası oluşturun:

```env
# Frontend Environment Variables
VITE_API_URL=https://your-backend.railway.app
VITE_APP_NAME=ratemet
VITE_APP_VERSION=1.0.0

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development
VITE_DEV_API_URL=http://localhost:5000
```

## 4. Railway Deployment

### 4.1 Railway Projesi
1. [Railway.app](https://railway.app) adresine gidin
2. GitHub ile giriş yapın
3. "New Project" > "Deploy from GitHub repo"
4. ratemet backend repository'nizi seçin

### 4.2 Environment Variables
Railway Dashboard'da environment variables ekleyin:
- Backend `.env` dosyasındaki tüm değişkenleri ekleyin
- `DATABASE_URL`'i Supabase connection string ile güncelleyin

### 4.3 Deployment
1. Railway otomatik olarak deploy edecek
2. Deployment URL'ini not edin
3. Frontend `.env` dosyasındaki `VITE_API_URL`'i güncelleyin

## 5. Vercel Deployment

### 5.1 Vercel Projesi
1. [Vercel.com](https://vercel.com) adresine gidin
2. GitHub ile giriş yapın
3. "New Project" > ratemet repository'nizi seçin

### 5.2 Environment Variables
Vercel Dashboard'da environment variables ekleyin:
- Frontend `.env` dosyasındaki tüm değişkenleri ekleyin

### 5.3 Deployment
1. Vercel otomatik olarak deploy edecek
2. Frontend URL'ini not edin
3. Backend `.env` dosyasındaki `CORS_ORIGIN`'i güncelleyin

## 6. Test Etme

### 6.1 Backend Test
```bash
# Backend dizininde
npm install
npm run dev

# Test endpoint'leri
curl https://your-backend.railway.app/health
curl https://your-backend.railway.app/test
curl https://your-backend.railway.app/db-test
```

### 6.2 Frontend Test
```bash
# Proje root dizininde
npm install
npm run dev

# Tarayıcıda test edin
http://localhost:5173
```

### 6.3 Test Kullanıcıları
Migration dosyasında oluşturulan test kullanıcıları:

**Admin:**
- Email: `admin@cinemahub.com`
- Password: `admin123`

**Operator:**
- Email: `operator@cinemahub.com`
- Password: `operator123`

## 7. Güvenlik Kontrolleri

### 7.1 Environment Variables
- Tüm API key'lerin güvenli olduğundan emin olun
- Production'da güçlü JWT_SECRET kullanın
- CORS ayarlarını kontrol edin

### 7.2 Database Güvenliği
- Supabase RLS (Row Level Security) ayarlarını kontrol edin
- API key'lerin doğru kullanıldığından emin olun

## 8. Monitoring

### 8.1 Supabase Dashboard
- Database performance'ını izleyin
- API kullanımını kontrol edin
- Error loglarını takip edin

### 8.2 Railway Dashboard
- Backend performance'ını izleyin
- Log'ları kontrol edin
- Resource kullanımını takip edin

### 8.3 Vercel Dashboard
- Frontend performance'ını izleyin
- Build loglarını kontrol edin
- Analytics'i takip edin

## 9. Troubleshooting

### 9.1 Yaygın Hatalar

**Database Connection Error:**
- DATABASE_URL'in doğru olduğunu kontrol edin
- Supabase password'ünü kontrol edin
- Network connectivity'yi kontrol edin

**CORS Error:**
- CORS_ORIGIN'in doğru frontend URL'ini içerdiğini kontrol edin
- Railway ve Vercel URL'lerini kontrol edin

**JWT Error:**
- JWT_SECRET'in doğru ayarlandığını kontrol edin
- Token expiration süresini kontrol edin

### 9.2 Log Kontrolü
```bash
# Railway logs
railway logs

# Vercel logs
vercel logs

# Local development
npm run dev
```

## 10. Production Checklist

- [ ] Supabase projesi oluşturuldu
- [ ] Database migration çalıştırıldı
- [ ] Environment variables ayarlandı
- [ ] Railway deployment tamamlandı
- [ ] Vercel deployment tamamlandı
- [ ] CORS ayarları kontrol edildi
- [ ] Test kullanıcıları ile giriş test edildi
- [ ] Admin paneli test edildi
- [ ] Operator paneli test edildi
- [ ] Movie CRUD işlemleri test edildi
- [ ] Rating sistemi test edildi
- [ ] Error handling kontrol edildi
- [ ] Performance test edildi

## 11. Sonraki Adımlar

1. **Analytics Ekleme**: Google Analytics veya Supabase Analytics
2. **Email Service**: Email doğrulama ve şifre sıfırlama
3. **File Upload**: Cloudinary entegrasyonu
4. **Search**: Elasticsearch veya PostgreSQL full-text search
5. **Caching**: Redis entegrasyonu
6. **Monitoring**: Sentry veya LogRocket
7. **Testing**: Jest ve Cypress testleri
8. **CI/CD**: GitHub Actions pipeline

---

**Not:** Bu rehberi takip ederek ratemet projenizi tamamen Supabase ile entegre edebilirsiniz. Herhangi bir sorunla karşılaşırsanız, log'ları kontrol edin ve gerekirse Supabase, Railway veya Vercel support'larına başvurun. 