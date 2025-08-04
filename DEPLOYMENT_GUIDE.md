# 🚀 CinemaHub Cloud Deployment Rehberi

## ✅ **Mevcut Durum:**
- GitHub hesabınız var ✅
- Proje GitHub'da: `https://github.com/emecyildiz/app.git` ✅
- Backend hazır ✅
- Frontend hazır ✅

---

## 🎯 **Hızlı Deployment Süreci**

### **1. Railway'e Backend Deploy Etme**

#### **A. Railway Hesabı Oluşturun:**
1. [Railway.app](https://railway.app) adresine gidin
2. GitHub hesabınızla giriş yapın
3. "New Project" → "Deploy from GitHub repo"
4. `emecyildiz/app` repository'sini seçin
5. "Deploy Now" tıklayın

#### **B. Environment Variables Ayarlayın:**
Railway dashboard'da şu environment variables'ları ekleyin:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### **C. Database Bağlantısı:**
1. Railway'de "New" → "Database" → "PostgreSQL"
2. Database'i projenize bağlayın
3. `DATABASE_URL` environment variable'ı otomatik oluşacak

#### **D. Backend URL'ini Not Edin:**
Railway size bir URL verecek: `https://your-app.railway.app`

---

### **2. Vercel'e Frontend Deploy Etme**

#### **A. Vercel Hesabı Oluşturun:**
1. [Vercel.com](https://vercel.com) adresine gidin
2. GitHub hesabınızla giriş yapın
3. "New Project" tıklayın
4. `emecyildiz/app` repository'sini seçin
5. Framework: "Vite" seçin
6. "Deploy" tıklayın

#### **B. Environment Variables Ayarlayın:**
Vercel dashboard'da şu environment variable'ı ekleyin:

```env
VITE_API_URL=https://your-backend.railway.app
```

#### **C. Frontend URL'ini Not Edin:**
Vercel size bir URL verecek: `https://your-app.vercel.app`

---

### **3. CORS Ayarlarını Güncelleyin**

Backend'deki CORS ayarını frontend URL'inizle güncelleyin:

```javascript
// backend/src/app.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-app.vercel.app',
  credentials: true
}));
```

---

### **4. Database Migration**

Railway'de terminal açın ve şu komutları çalıştırın:

```bash
# Prisma client oluştur
npx prisma generate

# Database migration
npx prisma migrate deploy
```

---

## 🔗 **URL'lerinizi Not Edin**

### **Backend (Railway):**
```
https://your-app.railway.app
```

### **Frontend (Vercel):**
```
https://your-app.vercel.app
```

### **Health Check:**
```
https://your-app.railway.app/health
```

---

## 🧪 **Test Etme**

### **1. Backend Test:**
```bash
curl https://your-app.railway.app/health
```

### **2. Frontend Test:**
- Vercel URL'inizi tarayıcıda açın
- Uygulama çalışıyor mu kontrol edin

### **3. API Test:**
```bash
curl https://your-app.railway.app/api/movies
```

---

## 🔄 **Otomatik Deployment**

### **GitHub'a Push Ettiğinizde:**
- ✅ Frontend otomatik deploy olacak (Vercel)
- ✅ Backend otomatik deploy olacak (Railway)

### **Deployment Komutları:**
```bash
# Değişiklikleri GitHub'a gönderin
git add .
git commit -m "Cloud deployment ready"
git push origin main
```

---

## 📊 **Monitoring**

### **Vercel Dashboard:**
- Sayfa görüntüleme sayıları
- Performance metrikleri
- Error logları

### **Railway Dashboard:**
- API response süreleri
- Database performansı
- Resource kullanımı

---

## 🎯 **Sonraki Adımlar**

1. **Railway hesabı açın** ve backend'i deploy edin
2. **Vercel hesabı açın** ve frontend'i deploy edin
3. **Environment variables'ları** ayarlayın
4. **Database migration'larını** çalıştırın
5. **Test edin** ve çalışıyor mu kontrol edin

Bu adımları takip ederek projenizi cloud'a deploy edebilirsiniz! 