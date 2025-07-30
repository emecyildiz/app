# Film Kütüphanesi Uygulaması

Modern ve kullanıcı dostu bir film kütüphanesi web uygulaması. React, Vite ve Tailwind CSS kullanılarak geliştirilmiştir.

## 🚀 Özellikler

- 🎬 Film arama ve listeleme
- ⭐ Favori film yönetimi
- 👤 Kullanıcı girişi ve kaydı
- 📱 Responsive tasarım
- 🌙 Modern ve şık arayüz
- 🔍 Gelişmiş arama özellikleri
- 📊 Film detayları ve bilgileri

## 🛠️ Teknolojiler

- **Frontend Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Form Handling:** React Hook Form
- **Routing:** React Router v6
- **Icons:** React Icons
- **HTTP Client:** Axios

## 📋 Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn

## 🔧 Kurulum

1. Projeyi klonlayın:
```bash
git clone [repository-url]
cd film-kutuphanesi
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment değişkenlerini ayarlayın:
```bash
cp .env.example .env
```

4. `.env` dosyasını düzenleyin ve gerekli API anahtarlarını ekleyin:
```
VITE_API_URL=your_api_url_here
VITE_API_KEY=your_api_key_here
```

## 🚀 Çalıştırma

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Proje Yapısı

```
film-kutuphanesi/
├── src/
│   ├── components/     # React bileşenleri
│   ├── pages/         # Sayfa bileşenleri
│   ├── services/      # API servisleri
│   ├── store/         # State yönetimi
│   ├── styles/        # CSS dosyaları
│   └── utils/         # Yardımcı fonksiyonlar
├── public/            # Statik dosyalar
├── .env.example       # Örnek environment dosyası
├── .gitignore        # Git ignore dosyası
├── package.json      # Proje bağımlılıkları
└── vite.config.js    # Vite konfigürasyonu
```

## 🔒 Güvenlik

### Önemli Güvenlik Notları

1. **Environment Değişkenleri:**
   - `.env` dosyasını ASLA git'e eklemeyin
   - Tüm hassas bilgileri (API anahtarları, şifreler) `.env` dosyasında saklayın
   - Production'da environment değişkenlerini güvenli bir şekilde yönetin

2. **API Anahtarları:**
   - API anahtarlarınızı frontend kodunda doğrudan kullanmayın
   - Mümkünse backend proxy kullanın
   - CORS ayarlarını doğru yapılandırın

3. **Güvenlik Kontrol Listesi:**
   - [ ] `.env` dosyası `.gitignore`'da mı?
   - [ ] API anahtarları gizli mi?
   - [ ] Hassas veriler şifreleniyor mu?
   - [ ] HTTPS kullanılıyor mu?
   - [ ] Input validasyonu yapılıyor mu?

4. **GitHub'a Yüklemeden Önce:**
   - `.gitignore` dosyasını kontrol edin
   - `git status` ile takip edilen dosyaları kontrol edin
   - Hassas bilgi içeren dosyaların takip edilmediğinden emin olun

## 📝 API Kullanımı

Uygulama, film verilerini almak için harici bir API kullanmaktadır. API anahtarınızı `.env` dosyasına eklemeyi unutmayın.

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👥 İletişim

Proje ile ilgili sorularınız için issue açabilirsiniz.

---

**Not:** Bu proje eğitim amaçlı geliştirilmiştir. Production kullanımı için ek güvenlik önlemleri alınmalıdır. 