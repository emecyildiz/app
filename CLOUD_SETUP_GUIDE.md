# ☁️ Cloud-Based ratemet Kurulum Rehberi

## 🎯 **Hedef: 7/24 Erişilebilir Uygulama**

### **Gereksinimler:**
- Bilgisayar kapalı olsa bile uygulama çalışır
- Kullanıcılar her yerden erişebilir
- Veriler güvenli şekilde saklanır
- Ücretsiz/uygun fiyatlı çözümler

---

## 🏗️ **Cloud Stack Mimarisi**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vercel)      │◄──►│   (Railway)     │◄──►│   (Supabase)    │
│   React App     │    │   Node.js API   │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📋 **Kurulum Adımları**

### **1. GitHub Hesabı Oluşturun**
- [GitHub.com](https://github.com) - Ücretsiz
- Kodlarınızı burada saklayacaksınız
- Cloud servisler GitHub'dan otomatik deploy edecek

### **2. Vercel Hesabı (Frontend)**
- [Vercel.com](https://vercel.com) - Ücretsiz
- GitHub hesabınızla giriş yapın
- React uygulamanızı burada host edeceksiniz

### **3. Railway Hesabı (Backend)**
- [Railway.app](https://railway.app) - Ücretsiz (500 saat/ay)
- GitHub hesabınızla giriş yapın
- Node.js API'nizi burada host edeceksiniz

### **4. Supabase Hesabı (Database)**
- [Supabase.com](https://supabase.com) - Ücretsiz
- PostgreSQL database'inizi burada oluşturacaksınız
- Authentication sistemi dahil

---

## 🛠️ **Teknoloji Öğrenme Sırası**

### **1. Hafta: Git & GitHub**
```bash
# Git kurulumu
git init
git add .
git commit -m "İlk commit"
git push origin main
```

**Öğrenme Kaynakları:**
- [GitHub Türkçe Rehber](https://docs.github.com/tr)
- [YouTube: Git Temelleri](https://www.youtube.com/watch?v=8oRjK8pclVY)

### **2. Hafta: Environment Variables**
```javascript
// .env dosyası
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key"
API_KEY="your-api-key"
```

**Öğrenme Kaynakları:**
- [Node.js Environment Variables](https://nodejs.org/en/docs/guides/environment-variables/)

### **3. Hafta: Supabase (Database)**
```javascript
// Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Veri çekme
const { data, error } = await supabase
  .from('movies')
  .select('*')
```

**Öğrenme Kaynakları:**
- [Supabase Türkçe Dokümantasyon](https://supabase.com/docs)
- [YouTube: Supabase Crash Course](https://www.youtube.com/watch?v=WiwfiVdfBRc)

### **4. Hafta: Railway (Backend)**
```javascript
// Railway'de çalışacak Express server
const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Öğrenme Kaynakları:**
- [Railway Dokümantasyon](https://docs.railway.app/)
- [YouTube: Railway Deployment](https://www.youtube.com/watch?v=7UQBC9VJgpg)

### **5. Hafta: Vercel (Frontend)**
```bash
# Vercel CLI kurulumu
npm i -g vercel

# Proje deploy etme
vercel --prod
```

**Öğrenme Kaynakları:**
- [Vercel Dokümantasyon](https://vercel.com/docs)
- [YouTube: Vercel Deployment](https://www.youtube.com/watch?v=7UQBC9VJgpg)

---

## 💰 **Maliyet Analizi**

### **Ücretsiz Planlar (Başlangıç için yeterli):**

**Vercel (Frontend):**
- ✅ Ücretsiz plan
- ✅ Özel domain desteği
- ✅ SSL sertifikası
- ✅ CDN dahil

**Railway (Backend):**
- ✅ 500 saat/ay ücretsiz
- ✅ PostgreSQL database dahil
- ✅ Otomatik deployment

**Supabase (Database):**
- ✅ 500MB storage ücretsiz
- ✅ 50,000 satır/ay ücretsiz
- ✅ Authentication sistemi

### **İleride Büyüdüğünde:**
- **Vercel Pro:** $20/ay
- **Railway:** $5-20/ay
- **Supabase Pro:** $25/ay

**Toplam:** ~$50/ay (büyük ölçekte)

---

## 🚀 **Hızlı Deployment Süreci**

### **1. GitHub'a Kod Yükleyin**
```bash
git add .
git commit -m "ratemet v1.0"
git push origin main
```

### **2. Vercel'e Deploy Edin**
- GitHub repository'nizi Vercel'e bağlayın
- Otomatik deployment aktif olacak
- Her push'ta otomatik güncellenecek

### **3. Railway'e Deploy Edin**
- Backend kodunuzu Railway'e bağlayın
- Environment variables'ları ayarlayın
- API'niz otomatik deploy olacak

### **4. Supabase Database'i Kurun**
- PostgreSQL database oluşturun
- Prisma migration'larını çalıştırın
- API'nizi database'e bağlayın

---

## 🔐 **Güvenlik Önlemleri**

### **Environment Variables:**
```env
# Vercel'de (Frontend)
NEXT_PUBLIC_API_URL=https://your-api.railway.app

# Railway'de (Backend)
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-super-secret-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### **API Güvenliği:**
```javascript
// CORS ayarları
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // IP başına 100 istek
}));
```

---

## 📊 **Monitoring & Analytics**

### **Vercel Analytics:**
- Sayfa görüntüleme sayıları
- Kullanıcı davranışları
- Performance metrikleri

### **Railway Monitoring:**
- API response süreleri
- Error logları
- Resource kullanımı

### **Supabase Dashboard:**
- Database performansı
- Kullanıcı istatistikleri
- Storage kullanımı

---

## 🎯 **Sonraki Adımlar**

1. **GitHub hesabı oluşturun**
2. **Vercel hesabı açın**
3. **Railway hesabı açın**
4. **Supabase hesabı açın**
5. **İlk cloud deployment'ı yapın**

Bu sistem ile bilgisayarınız kapalı olsa bile uygulamanız 7/24 çalışacak! 