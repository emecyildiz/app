# ratemet Backend

## 🚀 Deployment Sorun Giderme Kılavuzu

### CORS Hatası Çözümü

CORS hatası alındığında (`Access-Control-Allow-Origin header is present`):

1. **Backend'de CORS Ayarları:**
```javascript
// server.js dosyasında
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://app-eta-five-56.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
```

2. **Environment Variables Kontrolü:**
```env
# Backend .env
NODE_ENV=production
DATABASE_URL=postgresql://postgres.iqmocrrunczqgjnnukcd:porche911BEL@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://iqmocrrunczqgjnnukcd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGIN=https://app-eta-five-56.vercel.app

# Frontend .env
VITE_API_URL=https://app-production-c295.up.railway.app
VITE_SUPABASE_URL=https://iqmocrrunczqgjnnukcd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. **Railway Environment Variables:**
- Railway dashboard'da tüm environment variables'ların doğru ayarlandığından emin olun
- `PORT` değişkenini Railway'de ayarlamayın, otomatik atanmasına izin verin

### Database Bağlantı Sorunları

1. **Supabase Bağlantı URL'si:**
- Pooler URL'sini kullanın: `postgresql://postgres.iqmocrrunczqgjnnukcd:password@aws-0-eu-north-1.pooler.supabase.co:6543/postgres`
- Normal URL yerine pooler URL'si daha stabil çalışır

2. **JWT Ayarları:**
```javascript
const JWT_SECRET = 'your_jwt_secret';
const JWT_EXPIRES_IN = '7d';
```

### Railway Deployment Sorunları

1. **package.json Yapılandırması:**
```json
{
  "name": "cinemahub-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "@supabase/supabase-js": "^2.53.0"
  }
}
```

2. **Dosya Yapısı:**
```
backend/
├── src/
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

3. **Railway Yapılandırması:**
- Automatic Deployments aktif olmalı
- Environment variables doğru ayarlanmalı
- Health check endpoint'i `/health` olarak ayarlı olmalı

### Frontend-Backend Bağlantı Kontrolü

1. **Frontend'de API URL Kontrolü:**
```javascript
// src/store/authStore.js
const API_URL = import.meta.env.VITE_API_URL || 'https://app-production-c295.up.railway.app';
```

2. **Vercel'de Environment Variables:**
- `VITE_API_URL` Railway backend URL'si olmalı
- Diğer Supabase credentials'ları doğru ayarlanmalı

## 🔍 Hata Ayıklama

### Backend Logları Kontrol:
1. Railway dashboard'da Logs sekmesine gidin
2. ERROR ve WARNING loglarını kontrol edin
3. CORS ile ilgili logları inceleyin

### Frontend Logları Kontrol:
1. Browser Console'u açın (F12)
2. Network sekmesinde API çağrılarını kontrol edin
3. CORS veya authentication hataları var mı bakın

## 📝 Önemli Notlar

1. **Güvenlik:**
- JWT_SECRET değerini asla public repo'ya commit etmeyin
- Tüm hassas bilgileri .env dosyasında tutun
- .env dosyasını .gitignore'a ekleyin

2. **Deployment:**
- Her zaman önce local'de test edin
- Environment variables'ları double-check edin
- Railway ve Vercel dashboard'larında hata loglarını kontrol edin

3. **Monitoring:**
- `/health` endpoint'ini düzenli kontrol edin
- Railway metrics'i takip edin
- Error rate'i izleyin

## 🆘 Yaygın Hatalar ve Çözümleri

1. **"ERR_CONNECTION_REFUSED":**
- Backend'in çalışıp çalışmadığını kontrol edin
- API_URL'nin doğru olduğunu kontrol edin
- Railway deployment status'unu kontrol edin

2. **"No Authorization header":**
- Login response'unda token'ın döndüğünü kontrol edin
- Token'ın localStorage'da saklandığını kontrol edin
- Authorization header'ın doğru formatla gönderildiğini kontrol edin

3. **Database Connection Error:**
- DATABASE_URL'nin doğru olduğunu kontrol edin
- Supabase dashboard'da database status'unu kontrol edin
- IP restriction'ları kontrol edin

## 🔄 Yeniden Başlatma Prosedürü

Eğer hiçbir çözüm işe yaramazsa:

1. Railway'de projeyi yeniden deploy edin
2. Tüm environment variables'ları kontrol edin
3. Frontend'i Vercel'de yeniden deploy edin
4. Browser cache'ini temizleyin
5. API endpoint'lerini test edin