# Supabase RLS Düzeltme Rehberi - Doğru Tablo Yapısı

## Sorun Açıklaması
Supabase'de `public.movies` tablosunda RLS (Row Level Security) etkinleştirilmemiş durumda. Kullanıcılar `auth.users` tablosunda, kullanıcı bilgileri `public.profiles` tablosunda tutuluyor.

## Çözüm Adımları

### Adım 1: Mevcut Tabloları Kontrol Etme
Önce hangi tabloların mevcut olduğunu kontrol edin:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Bu sorgu size mevcut tabloları gösterecek. Muhtemelen şunları göreceksiniz:
- `profiles`
- `movies` (eğer varsa)
- `ratings` (eğer varsa)
- `favorites` (eğer varsa)
- `comments` (eğer varsa)

### Adım 2: RLS Düzeltme Scriptini Çalıştırma
1. `supabase_rls_fix_final.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. "Run" butonuna tıklayın

### Adım 3: RLS Durumunu Kontrol Etme
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
- `profiles` → `rowsecurity = true`
- `comments` → `rowsecurity = true`

### Adım 4: Politikaları Kontrol Etme
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

## Güvenlik Politikaları Açıklaması

### Movies Tablosu:
- **SELECT**: Herkes filmleri görüntüleyebilir
- **INSERT**: Sadece admin ve operator film ekleyebilir (profiles.role kontrolü)
- **UPDATE**: Sadece admin ve operator film güncelleyebilir
- **DELETE**: Sadece admin film silebilir

### Ratings Tablosu:
- **SELECT**: Herkes değerlendirmeleri görüntüleyebilir
- **ALL**: Kullanıcılar sadece kendi değerlendirmelerini yönetebilir

### Favorites Tablosu:
- **ALL**: Kullanıcılar sadece kendi favorilerini yönetebilir

### Profiles Tablosu:
- **SELECT/UPDATE**: Kullanıcılar kendi profillerini yönetebilir
- **ALL**: Admin ve operator tüm profilleri yönetebilir

### Comments Tablosu:
- **SELECT**: Herkes yorumları görüntüleyebilir
- **ALL**: Kullanıcılar sadece kendi yorumlarını yönetebilir

## Test Kullanıcıları Kontrolü

### Profiles Tablosundaki Kullanıcıları Kontrol Etme:
```sql
SELECT id, name, username, role, created_at 
FROM profiles 
WHERE role IN ('ADMIN', 'OPERATOR');
```

### Admin Kullanıcısı Oluşturma (eğer yoksa):
```sql
-- Önce auth.users tablosuna kullanıcı ekleyin (Supabase Auth ile)
-- Sonra profiles tablosuna bilgileri ekleyin
INSERT INTO profiles (id, name, username, role) 
VALUES ('user-uuid-from-auth', 'Admin User', 'admin', 'ADMIN')
ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';
```

## Olası Hatalar ve Çözümleri

### Hata: "relation does not exist"
**Çözüm:** Tablo adını kontrol edin:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Hata: "policy already exists"
**Çözüm:** Script zaten DROP POLICY IF EXISTS kullanıyor, bu hata gelmemeli.

### Hata: "permission denied"
**Çözüm:** 
- Supabase service role key kullanın
- Admin yetkilerinizi kontrol edin
- RLS politikalarını kontrol edin

## Test Etme

### Movies Tablosu Testleri:
```sql
-- Herkes filmleri görüntüleyebilmeli
SELECT * FROM movies LIMIT 5;
```

### Profiles Tablosu Testleri:
```sql
-- Kullanıcılar kendi profillerini görüntüleyebilmeli
SELECT * FROM profiles WHERE id = auth.uid();
```

## Sonraki Adımlar

1. **Uygulama Testi**: RLS düzeltmesinden sonra uygulamanızı test edin
2. **Auth Testi**: Login/logout işlemlerini test edin
3. **CRUD Testi**: Film ekleme, güncelleme, silme işlemlerini test edin
4. **Role Testi**: Admin ve operator rollerini test edin

## Güvenlik Kontrol Listesi

- [ ] RLS tüm tablolarda etkin
- [ ] Uygun güvenlik politikaları oluşturuldu
- [ ] Auth sistemi düzgün çalışıyor
- [ ] Role-based access control çalışıyor
- [ ] Public read access çalışıyor
- [ ] Admin/operator yetkileri çalışıyor

## Notlar

- RLS etkinleştirildikten sonra tüm veritabanı erişimleri politikalar tarafından kontrol edilir
- Auth olmayan kullanıcılar sadece public read işlemlerini yapabilir
- Admin ve operator rollerinin doğru atandığından emin olun
- Test kullanıcılarının rollerini kontrol edin
- Profiles tablosundaki role alanının doğru ayarlandığından emin olun

## Destek

Eğer sorun devam ederse:
1. Supabase Dashboard'da "Logs" bölümünü kontrol edin
2. SQL Editor'da hata mesajlarını inceleyin
3. Supabase documentation'ı kontrol edin
4. Gerekirse Supabase support'a başvurun
