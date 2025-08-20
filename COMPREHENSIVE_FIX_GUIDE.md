# ratemet Uygulama Kapsamlı Düzeltme Rehberi

## Mevcut Durum Analizi

### 1. Ana Sorun: Supabase RLS (Row Level Security)
**Sorun:** `public.movies` tablosunda RLS etkinleştirilmemiş
**Etki:** Güvenlik açığı, veritabanı erişim kontrolü yok
**Öncelik:** YÜKSEK

### 2. Auth Store Çakışması
**Sorun:** İki farklı auth store var (`authStore.js` ve `newAuthStore.js`)
**Etki:** Karışıklık, tutarsız auth state
**Öncelik:** ORTA

### 3. Veritabanı Bağlantısı
**Sorun:** 7 gün inaktiflik sonrası veritabanı durdurulmuş
**Durum:** Çözülmüş ✅
**Öncelik:** DÜŞÜK

## Çözüm Adımları

### Adım 1: RLS Sorununu Çözme (ÖNCELİKLİ)

#### 1.1 Supabase Dashboard'a Giriş
1. [Supabase.com](https://supabase.com) adresine gidin
2. Projenizi seçin
3. Sol menüden "SQL Editor" seçin

#### 1.2 RLS Düzeltme Scriptini Çalıştırma
1. `supabase_rls_fix.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. "Run" butonuna tıklayın

#### 1.3 RLS Durumunu Kontrol Etme
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Beklenen Sonuç:**
- `movies` → `rowsecurity = true`
- `ratings` → `rowsecurity = true`
- `favorites` → `rowsecurity = true`
- `users` → `rowsecurity = true`

#### 1.4 Politikaları Kontrol Etme
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

### Adım 2: Auth Store Birleştirme

#### 2.1 Hangi Auth Store Kullanılacağını Belirleme
**Önerilen:** `newAuthStore.js` (Supabase entegrasyonu daha iyi)

#### 2.2 Eski Auth Store'u Kaldırma
1. `src/store/authStore.js` dosyasını yedekleyin
2. Tüm import'ları `newAuthStore.js`'e yönlendirin

#### 2.3 Import Güncellemeleri
```javascript
// Eski
import { useAuthStore } from '../store/authStore'

// Yeni
import { useAuthStore } from '../store/newAuthStore'
```

### Adım 3: Environment Variables Kontrolü

#### 3.1 Frontend Environment Variables
`.env` dosyasını kontrol edin:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-backend.railway.app
```

#### 3.2 Backend Environment Variables
`backend/.env` dosyasını kontrol edin:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Adım 4: Test Kullanıcıları Kontrolü

#### 4.1 Test Kullanıcılarını Kontrol Etme
```sql
SELECT id, email, role, created_at 
FROM users 
WHERE email IN ('admin@cinemahub.com', 'operator@cinemahub.com');
```

#### 4.2 Eksik Kullanıcıları Oluşturma
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

### Adım 5: Uygulama Testi

#### 5.1 Temel Fonksiyonlar Testi
1. **Login/Logout:** Auth sistemi çalışıyor mu?
2. **Film Listesi:** Filmler görüntüleniyor mu?
3. **Film Detayı:** Film detay sayfaları açılıyor mu?
4. **Admin Panel:** Admin yetkileri çalışıyor mu?
5. **Operator Panel:** Operator yetkileri çalışıyor mu?

#### 5.2 CRUD İşlemleri Testi
1. **Film Ekleme:** Admin/Operator film ekleyebiliyor mu?
2. **Film Güncelleme:** Film bilgileri güncellenebiliyor mu?
3. **Film Silme:** Admin film silebiliyor mu?
4. **Rating:** Kullanıcılar film değerlendirebiliyor mu?

### Adım 6: Hata Ayıklama

#### 6.1 Console Hatalarını Kontrol Etme
1. Browser Developer Tools'u açın
2. Console sekmesini kontrol edin
3. Network sekmesinde API çağrılarını kontrol edin

#### 6.2 Supabase Logs Kontrolü
1. Supabase Dashboard'da "Logs" bölümüne gidin
2. Error loglarını kontrol edin
3. API kullanımını kontrol edin

#### 6.3 Railway Logs Kontrolü
1. Railway Dashboard'da projenizi açın
2. "Deployments" sekmesinde logları kontrol edin
3. "Variables" sekmesinde environment variables'ları kontrol edin

## Olası Hatalar ve Çözümleri

### Hata 1: "policy already exists"
**Çözüm:**
```sql
DROP POLICY IF EXISTS "Movies are viewable by everyone" ON public.movies;
-- Diğer politikalar için de aynısını yapın
```

### Hata 2: "relation does not exist"
**Çözüm:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Hata 3: "permission denied"
**Çözüm:**
- Supabase service role key kullanın
- Admin yetkilerinizi kontrol edin
- RLS politikalarını kontrol edin

### Hata 4: "CORS error"
**Çözüm:**
- Backend CORS ayarlarını kontrol edin
- Frontend URL'ini backend'e ekleyin

### Hata 5: "JWT error"
**Çözüm:**
- JWT_SECRET'in doğru ayarlandığını kontrol edin
- Token expiration süresini kontrol edin

## Güvenlik Kontrol Listesi

- [ ] RLS tüm tablolarda etkin
- [ ] Uygun güvenlik politikaları oluşturuldu
- [ ] Auth sistemi düzgün çalışıyor
- [ ] Role-based access control çalışıyor
- [ ] Public read access çalışıyor
- [ ] Admin/operator yetkileri çalışıyor
- [ ] Environment variables güvenli
- [ ] API key'ler doğru kullanılıyor

## Performans Kontrol Listesi

- [ ] Sayfa yükleme hızları kabul edilebilir
- [ ] API response süreleri uygun
- [ ] Database query'leri optimize
- [ ] Bundle size uygun
- [ ] Lazy loading çalışıyor
- [ ] Error handling düzgün

## Sonraki Adımlar

1. **Monitoring:** Uygulama performansını izleyin
2. **Backup:** Düzenli veritabanı yedekleri alın
3. **Updates:** Supabase ve diğer dependency'leri güncel tutun
4. **Security:** Güvenlik taramaları yapın
5. **Testing:** Otomatik testler ekleyin

## Destek

Eğer sorun devam ederse:
1. Supabase Dashboard'da "Logs" bölümünü kontrol edin
2. Railway Dashboard'da deployment loglarını kontrol edin
3. Browser Developer Tools'da console hatalarını kontrol edin
4. Supabase documentation'ı kontrol edin
5. Gerekirse Supabase support'a başvurun

## Notlar

- RLS etkinleştirildikten sonra tüm veritabanı erişimleri politikalar tarafından kontrol edilir
- Auth olmayan kullanıcılar sadece public read işlemlerini yapabilir
- Admin ve operator rollerinin doğru atandığından emin olun
- Test kullanıcılarının rollerini kontrol edin
- Environment variables'ların production'da güvenli olduğundan emin olun
