# CinemaHub - Modern Film Değerlendirme Platformu

CinemaHub, React ve modern web teknolojileri kullanılarak geliştirilmiş, kullanıcı dostu bir film değerlendirme platformudur.

## 🚀 Özellikler

- 🎬 **Geniş Film Veritabanı**: Binlerce film ve detaylı bilgiler
- ⭐ **Puanlama Sistemi**: Filmleri 10 üzerinden puanlayın
- 🔍 **Gelişmiş Arama**: Film adı veya türe göre arama yapın
- 👤 **Kullanıcı Profili**: Kişisel profil ve izleme geçmişi
- 🎨 **Modern Tasarım**: Karanlık tema ve responsive arayüz
- ⚡ **Hızlı Performans**: Vite ile optimize edilmiş build sistemi

## 🛠️ Teknolojiler

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Form Management**: React Hook Form
- **Icons**: Lucide React
- **UI Components**: Swiper, React Hot Toast

## 📦 Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/yourusername/cinemahub.git
cd cinemahub
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 🏗️ Proje Yapısı

```
cinemahub/
├── src/
│   ├── components/       # Yeniden kullanılabilir bileşenler
│   ├── pages/           # Sayfa bileşenleri
│   ├── services/        # API servisleri
│   ├── store/           # Zustand store'ları
│   ├── styles/          # Global stiller
│   ├── utils/           # Yardımcı fonksiyonlar
│   ├── hooks/           # Custom React hook'ları
│   ├── assets/          # Statik dosyalar
│   ├── App.jsx          # Ana uygulama bileşeni
│   └── main.jsx         # Uygulama giriş noktası
├── public/              # Statik dosyalar
├── index.html           # HTML şablonu
├── package.json         # Proje bağımlılıkları
├── vite.config.js       # Vite yapılandırması
├── tailwind.config.js   # Tailwind CSS yapılandırması
└── README.md           # Proje dokümantasyonu
```

## 📝 Kullanılabilir Komutlar

```bash
# Geliştirme sunucusunu başlat
npm run dev

# Production build oluştur
npm run build

# Build'i önizle
npm run preview

# Kod kalitesini kontrol et
npm run lint

# Kodu formatla
npm run format
```

## 🎨 Özelleştirme

### Tema Renkleri

Tema renklerini `tailwind.config.js` dosyasından özelleştirebilirsiniz:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Kendi renk paletinizi tanımlayın
      }
    }
  }
}
```

### API Endpoint'leri

`src/services/movieService.js` dosyasındaki `USE_MOCK_DATA` değişkenini `false` yaparak gerçek API'ye bağlanabilirsiniz:

```javascript
const USE_MOCK_DATA = false; // Gerçek API kullanmak için
```

## 🔐 Çevre Değişkenleri

Proje kök dizinine `.env` dosyası oluşturun:

```env
VITE_API_URL=https://api.example.com
VITE_API_KEY=your_api_key_here
```

## 🚀 Production Build

Production build oluşturmak için:

```bash
npm run build
```

Build dosyaları `dist/` klasörüne oluşturulacaktır.

## 📱 Responsive Tasarım

Uygulama tüm cihazlarda sorunsuz çalışacak şekilde tasarlanmıştır:
- 📱 Mobil cihazlar (320px ve üzeri)
- 📱 Tabletler (768px ve üzeri)
- 💻 Masaüstü (1024px ve üzeri)

## 🤝 Katkıda Bulunma

1. Projeyi fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit'leyin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 İletişim

Proje Linki: [https://github.com/yourusername/cinemahub](https://github.com/yourusername/cinemahub)

---

Made with ❤️ by CinemaHub Team 