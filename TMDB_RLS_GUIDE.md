# TMDB API ile RLS Düzeltme Rehberi

## ✅ Mevcut Durum
- Filmler TMDB API'den alınıyor
- Local film ekleme/silme işlemleri yok
- Tablolar: `comments`, `friendships`, `movies`, `profiles`, `ratings`
- .env dosyaları hazır
- API ayarları tamam

## 🚀 Hızlı Çözüm

### 1. Supabase SQL Editor'a Gidin
1. [Supabase.com](https://supabase.com) → Projeniz → SQL Editor

### 2. RLS Scriptini Çalıştırın
1. `supabase_rls_fix_tmdb.sql` dosyasını açın
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

## 🔒 Güvenlik Politikaları (TMDB API Uyumlu)

### Movies Tablosu:
- ✅ **Herkes filmleri görüntüleyebilir** (TMDB'den alınan filmler)
- ✅ **Local film ekleme** (eğer varsa) - Sadece admin/operator
- ✅ **Local film güncelleme** (eğer varsa) - Sadece admin/operator
- ✅ **Local film silme** (eğer varsa) - Sadece admin

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

## 🎬 TMDB API Entegrasyonu

### Film Verileri:
- Filmler TMDB API'den alınıyor
- Local `movies` tablosu sadece cache/veri saklama için
- Film ekleme/silme TMDB üzerinden yapılmıyor

### Kullanıcı Etkileşimleri:
- **Ratings**: Kullanıcılar TMDB filmlerini değerlendirebilir
- **Comments**: Kullanıcılar TMDB filmlerine yorum yapabilir
- **Favorites**: Kullanıcılar TMDB filmlerini favorilere ekleyebilir

## 🧪 Test Etme

### 1. Uygulamayı Başlatın
```bash
npm run dev
```

### 2. TMDB API Testleri
- [ ] Film listesi TMDB'den yükleniyor
- [ ] Film detayları TMDB'den alınıyor
- [ ] Film arama çalışıyor
- [ ] Film posterleri görüntüleniyor

### 3. Kullanıcı Etkileşimi Testleri
- [ ] Film değerlendirme çalışıyor
- [ ] Yorum yazma çalışıyor
- [ ] Favorilere ekleme çalışıyor
- [ ] Profil güncelleme çalışıyor

### 4. Admin Testleri (eğer admin kullanıcınız varsa)
- [ ] Admin paneline erişim
- [ ] Kullanıcı yönetimi
- [ ] Sistem ayarları

## 🔧 TMDB API Konfigürasyonu

### Environment Variables Kontrolü:
```env
# TMDB API
VITE_TMDB_API_KEY=your-tmdb-api-key
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### TMDB API Endpoints:
- Film listesi: `/movie/popular`
- Film detayı: `/movie/{id}`
- Film arama: `/search/movie`
- Film posterleri: `/movie/{id}/images`

## 🆘 Sorun Giderme

### TMDB API Hataları:
- **API Key eksik**: TMDB API key'ini kontrol edin
- **Rate limit**: TMDB API limitlerini kontrol edin
- **Network error**: İnternet bağlantısını kontrol edin

### RLS Hataları:
- **Permission denied**: RLS politikalarını kontrol edin
- **Policy already exists**: Script zaten DROP POLICY IF EXISTS kullanıyor

### Uygulama Hataları:
- **Film yüklenmiyor**: TMDB API key'ini kontrol edin
- **Rating kaydedilmiyor**: RLS politikalarını kontrol edin
- **Login çalışmıyor**: Supabase ayarlarını kontrol edin

## ✅ Tamamlandı

RLS düzeltmesi tamamlandıktan sonra:
- ✅ Güvenlik açığı kapatıldı
- ✅ TMDB API entegrasyonu korundu
- ✅ Kullanıcı etkileşimleri güvenli
- ✅ Tüm tablolar korunuyor

## 📞 Destek

Eğer sorun devam ederse:
1. TMDB API key'ini kontrol edin
2. Supabase Dashboard → Logs
3. Console hatalarını kontrol edin
4. Network sekmesinde API çağrılarını kontrol edin
