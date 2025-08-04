# 🚀 CinemaHub Backend API

Bu proje, CinemaHub film platformu için RESTful API backend'idir.

## 🛠️ Teknolojiler

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Veritabanı
- **Prisma** - ORM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File uploads
- **Cloudinary** - Cloud storage

## 📋 Gereksinimler

- Node.js (v16 veya üzeri)
- PostgreSQL (v12 veya üzeri)
- npm veya yarn

## 🚀 Kurulum

### 1. Repository'yi klonlayın
```bash
git clone <repository-url>
cd backend
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Environment variables'ları ayarlayın
```bash
cp env.example .env
```

`.env` dosyasını düzenleyerek gerekli değerleri girin:
- `DATABASE_URL`: PostgreSQL bağlantı URL'i
- `JWT_SECRET`: JWT token için gizli anahtar
- `CLOUDINARY_*`: Cloudinary ayarları (opsiyonel)

### 4. Veritabanını kurun
```bash
# Prisma client'ı oluşturun
npx prisma generate

# Veritabanı migration'larını çalıştırın
npx prisma migrate dev
```

### 5. Uygulamayı başlatın
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Users
- `GET /api/users` - Tüm kullanıcıları listele (Admin/Operator)
- `GET /api/users/:id` - Kullanıcı detayı
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil (Admin/Operator)

### Movies
- `GET /api/movies` - Filmleri listele
- `GET /api/movies/:id` - Film detayı
- `POST /api/movies/:id/rate` - Film değerlendir
- `GET /api/movies/search` - Film arama
- `GET /api/movies/trending` - Trend filmler

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Kullanıcı yönetimi
- `GET /api/admin/movies` - Film yönetimi

## 🔐 Authentication

API, JWT token tabanlı authentication kullanır. Protected endpoint'ler için `Authorization` header'ında `Bearer <token>` formatında token gönderilmelidir.

### Örnek:
```bash
curl -H "Authorization: Bearer your-jwt-token" \
     http://localhost:5000/api/users
```

## 🗄️ Veritabanı

### Modeller

#### User
- `id`: Unique identifier
- `email`: Email adresi (unique)
- `passwordHash`: Şifrelenmiş parola
- `name`: Kullanıcı adı
- `username`: Kullanıcı adı (unique)
- `role`: Kullanıcı rolü (USER, OPERATOR, ADMIN)
- `bio`: Kullanıcı biyografisi
- `location`: Konum
- `avatarUrl`: Profil resmi URL'i
- `memberSince`: Üyelik tarihi
- `socialLinks`: Sosyal medya linkleri (JSON)
- `isActive`: Hesap aktif mi?

#### Movie
- `id`: Unique identifier
- `title`: Film başlığı
- `description`: Film açıklaması
- `releaseYear`: Yayın yılı
- `duration`: Süre (dakika)
- `posterUrl`: Poster URL'i
- `trailerUrl`: Trailer URL'i
- `genres`: Film türleri (JSON)
- `cast`: Oyuncular (JSON)
- `director`: Yönetmen
- `averageRating`: Ortalama puan
- `totalRatings`: Toplam değerlendirme sayısı

#### Rating
- `id`: Unique identifier
- `rating`: Puan (1-10)
- `review`: Değerlendirme metni
- `userId`: Kullanıcı ID (foreign key)
- `movieId`: Film ID (foreign key)

#### Favorite
- `id`: Unique identifier
- `userId`: Kullanıcı ID (foreign key)
- `movieId`: Film ID (foreign key)

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm test

# Test'leri watch mode'da çalıştır
npm run test:watch
```

## 📊 Prisma Studio

Veritabanını görsel olarak yönetmek için:

```bash
npx prisma studio
```

Bu komut tarayıcıda Prisma Studio'yu açar.

## 🔧 Development

### Scripts
- `npm run dev` - Development server'ı başlat
- `npm start` - Production server'ı başlat
- `npm test` - Test'leri çalıştır
- `npm run prisma:generate` - Prisma client'ı oluştur
- `npm run prisma:migrate` - Migration'ları çalıştır
- `npm run prisma:studio` - Prisma Studio'yu aç

### Environment Variables
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT secret key
- `JWT_EXPIRES_IN`: JWT expiration time
- `CORS_ORIGIN`: CORS origin URL

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 