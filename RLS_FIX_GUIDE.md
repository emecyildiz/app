# Supabase RLS (Row Level Security) Düzeltme Rehberi

## Sorun Açıklaması
Supabase'de `public.movies` tablosunda RLS (Row Level Security) etkinleştirilmemiş durumda. Bu güvenlik açığına neden oluyor.

## Çözüm Adımları

### 1. Supabase Dashboard'a Giriş
1. [Supabase.com](https://supabase.com) adresine gidin
2. Projenizi seçin
3. Sol menüden "SQL Editor" seçin

### 2. RLS Düzeltme Scriptini Çalıştırma
1. `supabase_rls_fix.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. "Run" butonuna tıklayın

### 3. RLS Durumunu Kontrol Etme
SQL Editor'da şu sorguyu çalıştırın:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Beklenen sonuç:
- `movies` tablosunda `rowsecurity = true` olmalı
- `ratings` tablosunda `rowsecurity = true` olmalı
- `favorites` tablosunda `rowsecurity = true` olmalı
- `users` tablosunda `rowsecurity = true` olmalı

### 4. Politikaları Kontrol Etme
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

### 5. Test Etme

#### Movies Tablosu Testleri:
```sql
-- Herkes filmleri görüntüleyebilmeli
SELECT * FROM movies LIMIT 5;

-- Admin/Operator film ekleyebilmeli (auth.uid() ile test)
-- Bu test için Supabase Auth kullanmanız gerekir
```

#### Ratings Tablosu Testleri:
```sql
-- Herkes değerlendirmeleri görüntüleyebilmeli
SELECT * FROM ratings LIMIT 5;
```

## Güvenlik Politikaları Açıklaması

### Movies Tablosu:
- **SELECT**: Herkes filmleri görüntüleyebilir
- **INSERT**: Sadece admin ve operator film ekleyebilir
- **UPDATE**: Sadece admin ve operator film güncelleyebilir
- **DELETE**: Sadece admin film silebilir

### Ratings Tablosu:
- **SELECT**: Herkes değerlendirmeleri görüntüleyebilir
- **ALL**: Kullanıcılar sadece kendi değerlendirmelerini yönetebilir

### Favorites Tablosu:
- **ALL**: Kullanıcılar sadece kendi favorilerini yönetebilir

### Users Tablosu:
- **SELECT/UPDATE**: Kullanıcılar kendi profillerini yönetebilir
- **ALL**: Admin ve operator tüm kullanıcıları yönetebilir

## Olası Hatalar ve Çözümleri

### Hata: "policy already exists"
**Çözüm:** Mevcut politikaları silin ve yeniden oluşturun:
```sql
DROP POLICY IF EXISTS "Movies are viewable by everyone" ON public.movies;
-- Diğer politikalar için de aynısını yapın
```

### Hata: "relation does not exist"
**Çözüm:** Tabloların mevcut olduğundan emin olun:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Hata: "permission denied"
**Çözüm:** Supabase service role key kullanın veya admin yetkilerinizi kontrol edin.

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

## Destek

Eğer sorun devam ederse:
1. Supabase Dashboard'da "Logs" bölümünü kontrol edin
2. SQL Editor'da hata mesajlarını inceleyin
3. Supabase documentation'ı kontrol edin
4. Gerekirse Supabase support'a başvurun
