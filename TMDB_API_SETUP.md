# TMDB API Kurulum Rehberi

## 🚨 Sorun: TMDB API Key Eksik

Geçen hafta çalışıyordu çünkü muhtemelen farklı bir konfigürasyon kullanıyordunuz. Şimdi TMDB API'ye doğrudan bağlanmak için API key'e ihtiyacımız var.

## 🔑 TMDB API Key Alma

### 1. TMDB Hesabı Oluşturun
1. [themoviedb.org](https://www.themoviedb.org) sitesine gidin
2. "Sign Up" ile hesap oluşturun

### 2. API Key Alın
1. [TMDB Settings](https://www.themoviedb.org/settings/api) sayfasına gidin
2. "API Read Access Token (v4 auth)" bölümünde "Click to generate" butonuna tıklayın
3. API key'inizi kopyalayın

## 📝 Environment Variables

### Frontend (.env dosyası)
```env
# TMDB API
VITE_TMDB_API_KEY=your-tmdb-api-key-here

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env dosyası)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=8080
NODE_ENV=production
```

## 🧪 Test Etme

### 1. API Key'i Kontrol Edin
```javascript
// Browser console'da test edin
console.log('TMDB API Key:', import.meta.env.VITE_TMDB_API_KEY)
```

### 2. Uygulamayı Yeniden Başlatın
```bash
npm run dev
```

### 3. Film Listesini Kontrol Edin
- Ana sayfa yükleniyor mu?
- Film posterleri görünüyor mu?
- Film detayları açılıyor mu?

## 🔄 Alternatif Çözümler

### Seçenek 1: Mock Data'ya Geç (Hızlı)
```javascript
// src/services/movieService.js
const USE_TMDB_API = false
const USE_MOCK_DATA = true
```

### Seçenek 2: Backend'i Düzelt (Uzun Vadeli)
Backend'e film endpoint'leri eklemek için backend'i güncelleyin.

## 📞 Destek

Eğer TMDB API key almakta sorun yaşıyorsanız:
1. TMDB hesabınızı kontrol edin
2. API key'in doğru kopyalandığından emin olun
3. .env dosyasının doğru konumda olduğunu kontrol edin

## ✅ Sonuç

TMDB API key'i eklendikten sonra:
- ✅ Filmler TMDB'den gelecek
- ✅ Gerçek film posterleri görünecek
- ✅ Film detayları tam olacak
- ✅ Arama çalışacak
