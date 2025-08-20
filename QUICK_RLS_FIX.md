# Hızlı RLS Düzeltme Rehberi

## ✅ Mevcut Durum
- Tablolar: `comments`, `friendships`, `movies`, `profiles`, `ratings`
- .env dosyaları hazır
- API ayarları tamam
- Uygulama geçen hafta çalışıyordu

## 🚀 Hızlı Çözüm

### 1. Supabase SQL Editor'a Gidin
1. [Supabase.com](https://supabase.com) → Projeniz → SQL Editor

### 2. RLS Scriptini Çalıştırın
1. `supabase_rls_fix_complete.sql` dosyasını açın
2. Tüm içeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. "Run" butonuna tıklayın

### 3. RLS Durumunu Kontrol Edin
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Beklenen Sonuç:**
- `comments` → `rowsecurity = true`
- `friendships` → `rowsecurity = true`
- `movies` → `rowsecurity = true`
- `profiles` → `rowsecurity = true`
- `ratings` → `rowsecurity = true`

### 4. Politikaları Kontrol Edin
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

## 🔒 Güvenlik Politikaları

### Movies Tablosu:
- ✅ Herkes filmleri görüntüleyebilir
- ✅ Sadece admin/operator film ekleyebilir
- ✅ Sadece admin/operator film güncelleyebilir
- ✅ Sadece admin film silebilir

### Ratings Tablosu:
- ✅ Herkes değerlendirmeleri görüntüleyebilir
- ✅ Kullanıcılar kendi değerlendirmelerini yönetebilir

### Profiles Tablosu:
- ✅ Kullanıcılar kendi profillerini yönetebilir
- ✅ Admin/operator tüm profilleri yönetebilir

### Comments Tablosu:
- ✅ Herkes yorumları görüntüleyebilir
- ✅ Kullanıcılar kendi yorumlarını yönetebilir

### Friendships Tablosu:
- ✅ Kullanıcılar kendi arkadaşlık isteklerini yönetebilir
- ✅ Kullanıcılar arkadaşlık durumlarını görüntüleyebilir

## 🧪 Test Etme

### 1. Uygulamayı Başlatın
```bash
npm run dev
```

### 2. Temel Testler
- [ ] Ana sayfa yükleniyor
- [ ] Film listesi görüntüleniyor
- [ ] Login/logout çalışıyor
- [ ] Film detay sayfaları açılıyor

### 3. Admin Testleri (eğer admin kullanıcınız varsa)
- [ ] Admin paneline erişim
- [ ] Film ekleme/düzenleme
- [ ] Kullanıcı yönetimi

## 🆘 Sorun Giderme

### Hata: "policy already exists"
**Çözüm:** Script zaten DROP POLICY IF EXISTS kullanıyor, bu hata gelmemeli.

### Hata: "permission denied"
**Çözüm:** 
- Supabase service role key kullanın
- Admin yetkilerinizi kontrol edin

### Uygulama Çalışmıyor
**Çözüm:**
1. Environment variables'ları kontrol edin
2. Backend'i yeniden başlatın: `cd backend && npm start`
3. Frontend'i yeniden başlatın: `npm run dev`

## ✅ Tamamlandı

RLS düzeltmesi tamamlandıktan sonra:
- Güvenlik açığı kapatıldı
- Tüm tablolar korunuyor
- Uygulama güvenli şekilde çalışıyor

## 📞 Destek

Eğer sorun devam ederse:
1. Supabase Dashboard → Logs
2. Console hatalarını kontrol edin
3. Network sekmesinde API çağrılarını kontrol edin
