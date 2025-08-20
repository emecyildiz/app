# ratemet Final Kurulum Rehberi

## ✅ Tamamlanan İşlemler

### 1. RLS Sorununu Çözme
- `supabase_rls_fix.sql` dosyası oluşturuldu
- RLS düzeltme rehberi hazırlandı
- Güvenlik politikaları tanımlandı

### 2. Auth Store Birleştirme
- Eski `authStore.js` dosyası kaldırıldı
- Tüm dosyalar `newAuthStore.js` kullanıyor ✅
- Auth store çakışması çözüldü

### 3. Backend Dependencies
- Backend package.json güncellendi
- Gerekli dependencies eklendi
- npm install tamamlandı

### 4. Kapsamlı Rehberler
- `RLS_FIX_GUIDE.md` - RLS düzeltme rehberi
- `COMPREHENSIVE_FIX_GUIDE.md` - Kapsamlı düzeltme rehberi

## 🔧 Yapılması Gerekenler

### 1. Environment Variables Ayarlama

#### Frontend (.env dosyası oluşturun):
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

#### Backend (backend/.env dosyası oluşturun):
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
ALLOWED_ORIGIN=http://localhost:3001,https://app-eta-five-56.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Supabase RLS Düzeltmesi

#### Adım 1: Supabase Dashboard'a Giriş
1. [Supabase.com](https://supabase.com) adresine gidin
2. Projenizi seçin
3. Sol menüden "SQL Editor" seçin

#### Adım 2: RLS Scriptini Çalıştırma
1. `supabase_rls_fix.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. "Run" butonuna tıklayın

#### Adım 3: RLS Durumunu Kontrol Etme
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 3. Uygulama Testi

#### Frontend Testi:
```bash
cd /c/Users/Lenovo/OneDrive/Desktop/app
npm run dev
```

#### Backend Testi:
```bash
cd /c/Users/Lenovo/OneDrive/Desktop/app/backend
npm start
```

### 4. Test Kullanıcıları

#### Test Kullanıcılarını Kontrol Etme:
```sql
SELECT id, email, role, created_at 
FROM users 
WHERE email IN ('admin@cinemahub.com', 'operator@cinemahub.com');
```

#### Eksik Kullanıcıları Oluşturma:
```sql
-- Admin kullanıcısı
INSERT INTO users (email, password_hash, role, name) 
VALUES ('admin@cinemahub.com', 'hashed_password', 'ADMIN', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Operator kullanıcısı
INSERT INTO users (email, password_hash, role, name) 
VALUES ('operator@cinemahub.com', 'hashed_password', 'OPERATOR', 'Operator User')
ON CONFLICT (email) DO NOTHING;
```

## 🚀 Çalıştırma Komutları

### Development Modu:
```bash
# Frontend (Terminal 1)
cd /c/Users/Lenovo/OneDrive/Desktop/app
npm run dev

# Backend (Terminal 2)
cd /c/Users/Lenovo/OneDrive/Desktop/app/backend
npm run dev
```

### Production Modu:
```bash
# Frontend
npm run build
npm run preview

# Backend
npm start
```

## 🔍 Test Edilecek Fonksiyonlar

### 1. Temel Fonksiyonlar
- [ ] Login/Logout işlemleri
- [ ] Film listesi görüntüleme
- [ ] Film detay sayfaları
- [ ] Admin paneli erişimi
- [ ] Operator paneli erişimi

### 2. CRUD İşlemleri
- [ ] Film ekleme (Admin/Operator)
- [ ] Film güncelleme (Admin/Operator)
- [ ] Film silme (Admin)
- [ ] Film değerlendirme (Kullanıcılar)

### 3. Güvenlik Testleri
- [ ] RLS politikaları çalışıyor
- [ ] Role-based access control
- [ ] Public read access
- [ ] Admin/operator yetkileri

## 📋 Kontrol Listesi

### Environment Variables
- [ ] Frontend .env dosyası oluşturuldu
- [ ] Backend .env dosyası oluşturuldu
- [ ] Supabase URL ve key'ler doğru
- [ ] API URL'leri doğru

### Supabase
- [ ] RLS scripti çalıştırıldı
- [ ] RLS durumu kontrol edildi
- [ ] Politikalar oluşturuldu
- [ ] Test kullanıcıları mevcut

### Uygulama
- [ ] Frontend çalışıyor
- [ ] Backend çalışıyor
- [ ] Database bağlantısı çalışıyor
- [ ] Auth sistemi çalışıyor

## 🆘 Sorun Giderme

### Hata: "policy already exists"
```sql
DROP POLICY IF EXISTS "Movies are viewable by everyone" ON public.movies;
-- Diğer politikalar için de aynısını yapın
```

### Hata: "relation does not exist"
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Hata: "permission denied"
- Supabase service role key kullanın
- Admin yetkilerinizi kontrol edin
- RLS politikalarını kontrol edin

### Hata: "CORS error"
- Backend CORS ayarlarını kontrol edin
- Frontend URL'ini backend'e ekleyin

## 📞 Destek

Eğer sorun devam ederse:
1. Supabase Dashboard'da "Logs" bölümünü kontrol edin
2. Railway Dashboard'da deployment loglarını kontrol edin
3. Browser Developer Tools'da console hatalarını kontrol edin
4. Supabase documentation'ı kontrol edin
5. Gerekirse Supabase support'a başvurun

## 🎯 Sonraki Adımlar

1. **Monitoring:** Uygulama performansını izleyin
2. **Backup:** Düzenli veritabanı yedekleri alın
3. **Updates:** Supabase ve diğer dependency'leri güncel tutun
4. **Security:** Güvenlik taramaları yapın
5. **Testing:** Otomatik testler ekleyin

---

**Not:** Bu rehberi takip ederek ratemet uygulamanızı tamamen çalışır duruma getirebilirsiniz. Herhangi bir sorunla karşılaşırsanız, yukarıdaki sorun giderme bölümünü kontrol edin.
