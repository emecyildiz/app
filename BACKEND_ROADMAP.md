# 🚀 CinemaHub Backend Geliştirme Yol Haritası

## 📋 Proje Analizi

### Mevcut Frontend Yapısı
- **Framework**: React + Vite
- **State Management**: Zustand
- **UI**: Tailwind CSS + Heroicons
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Authentication**: Client-side (mock data)

### Backend İhtiyaçları
1. **Kullanıcı Yönetimi** (Admin, Operator, User rolleri)
2. **Film Veritabanı** (CRUD işlemleri)
3. **Kullanıcı Favorileri**
4. **Film Değerlendirme Sistemi**
5. **Arama ve Filtreleme**
6. **Güvenlik ve Yetkilendirme**

---

## 🏗️ Backend Mimarisi Önerisi

### Teknoloji Stack'i
```
Backend: Node.js + Express.js
Database: PostgreSQL + Prisma ORM
Authentication: JWT + bcrypt
File Upload: Multer + Cloudinary
API Documentation: Swagger/OpenAPI
Testing: Jest + Supertest
```

### Klasör Yapısı
```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── movieController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── roleCheck.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Movie.js
│   │   ├── Rating.js
│   │   └── Favorite.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── movies.js
│   │   └── admin.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── movieService.js
│   │   └── emailService.js
│   ├── utils/
│   │   ├── database.js
│   │   ├── logger.js
│   │   └── helpers.js
│   └── app.js
├── prisma/
│   └── schema.prisma
├── tests/
├── .env
├── package.json
└── README.md
```

---

## 📊 Veritabanı Şeması

### Users Tablosu
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  role ENUM('user', 'operator', 'admin') DEFAULT 'user',
  bio TEXT,
  location VARCHAR(255),
  avatar_url VARCHAR(500),
  member_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  social_links JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Movies Tablosu
```sql
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  release_year INTEGER,
  duration INTEGER, -- dakika cinsinden
  poster_url VARCHAR(500),
  trailer_url VARCHAR(500),
  genres JSONB,
  cast JSONB,
  director VARCHAR(255),
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Ratings Tablosu
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, movie_id)
);
```

### Favorites Tablosu
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, movie_id)
);
```

---

## 🔐 API Endpoints

### Authentication Routes
```
POST /api/auth/register     - Kullanıcı kaydı
POST /api/auth/login        - Giriş
POST /api/auth/logout       - Çıkış
POST /api/auth/refresh      - Token yenileme
GET  /api/auth/me           - Mevcut kullanıcı bilgisi
```

### User Routes
```
GET    /api/users           - Tüm kullanıcıları listele (Admin/Operator)
GET    /api/users/:id       - Kullanıcı detayı
PUT    /api/users/:id       - Kullanıcı güncelle
DELETE /api/users/:id       - Kullanıcı sil (Admin/Operator)
GET    /api/users/:id/profile - Kullanıcı profili
PUT    /api/users/:id/profile - Profil güncelle
```

### Movie Routes
```
GET    /api/movies          - Filmleri listele (sayfalama, filtreleme)
GET    /api/movies/:id      - Film detayı
POST   /api/movies          - Film ekle (Admin)
PUT    /api/movies/:id      - Film güncelle (Admin)
DELETE /api/movies/:id      - Film sil (Admin)
GET    /api/movies/search   - Film arama
GET    /api/movies/trending - Trend filmler
GET    /api/movies/genres   - Tüm türler
```

### Rating Routes
```
POST   /api/movies/:id/rate - Film değerlendir
PUT    /api/movies/:id/rate - Değerlendirme güncelle
DELETE /api/movies/:id/rate - Değerlendirme sil
GET    /api/movies/:id/ratings - Film değerlendirmeleri
```

### Favorite Routes
```
GET    /api/favorites       - Kullanıcının favorileri
POST   /api/favorites/:movieId - Favorilere ekle
DELETE /api/favorites/:movieId - Favorilerden çıkar
```

### Admin Routes
```
GET    /api/admin/dashboard - Admin dashboard istatistikleri
GET    /api/admin/users     - Kullanıcı yönetimi
GET    /api/admin/movies    - Film yönetimi
POST   /api/admin/users/:id/role - Kullanıcı rolü değiştir
```

---

## 🛠️ Geliştirme Aşamaları

### Aşama 1: Temel Kurulum (1-2 gün)
- [ ] Node.js + Express.js kurulumu
- [ ] PostgreSQL veritabanı kurulumu
- [ ] Prisma ORM kurulumu ve konfigürasyonu
- [ ] Temel proje yapısının oluşturulması
- [ ] Environment variables konfigürasyonu
- [ ] CORS ve güvenlik middleware'leri

### Aşama 2: Authentication Sistemi (2-3 gün)
- [ ] JWT token sistemi
- [ ] Password hashing (bcrypt)
- [ ] User model ve migration
- [ ] Register/Login endpoints
- [ ] Authentication middleware
- [ ] Role-based authorization

### Aşama 3: Kullanıcı Yönetimi (2-3 gün)
- [ ] User CRUD operations
- [ ] Profile management
- [ ] Admin/Operator user management
- [ ] User search ve filtreleme
- [ ] Avatar upload sistemi

### Aşama 4: Film Sistemi (3-4 gün)
- [ ] Movie model ve migration
- [ ] Movie CRUD operations
- [ ] Film arama ve filtreleme
- [ ] Genre sistemi
- [ ] Poster upload sistemi
- [ ] Pagination

### Aşama 5: Rating ve Favorites (2-3 gün)
- [ ] Rating model ve migration
- [ ] Favorite model ve migration
- [ ] Rating CRUD operations
- [ ] Favorite CRUD operations
- [ ] Average rating hesaplama

### Aşama 6: Admin Dashboard (2-3 gün)
- [ ] Admin dashboard endpoints
- [ ] İstatistik API'leri
- [ ] User management endpoints
- [ ] Movie management endpoints
- [ ] Role management

### Aşama 7: Frontend Entegrasyonu (2-3 gün)
- [ ] Frontend API servislerini güncelleme
- [ ] Authentication entegrasyonu
- [ ] Error handling
- [ ] Loading states
- [ ] Real-time updates

### Aşama 8: Test ve Optimizasyon (2-3 gün)
- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation (Swagger)
- [ ] Performance optimizasyonu
- [ ] Security audit

---

## 🚀 Başlangıç Komutları

### Backend Kurulumu
```bash
# Yeni backend klasörü oluştur
mkdir backend
cd backend

# Package.json oluştur
npm init -y

# Gerekli paketleri yükle
npm install express cors helmet morgan dotenv bcryptjs jsonwebtoken multer cloudinary
npm install prisma @prisma/client
npm install -D nodemon jest supertest

# Prisma kurulumu
npx prisma init

# Veritabanı migration
npx prisma migrate dev

# Development server
npm run dev
```

### Environment Variables (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/cinemahub"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🔧 Önerilen Araçlar

### Development
- **Postman/Insomnia**: API testing
- **pgAdmin**: PostgreSQL yönetimi
- **VS Code Extensions**: Prisma, REST Client

### Production
- **Docker**: Containerization
- **PM2**: Process management
- **Nginx**: Reverse proxy
- **Redis**: Caching (opsiyonel)

### Monitoring
- **Winston**: Logging
- **Sentry**: Error tracking
- **New Relic**: Performance monitoring

---

## 📝 Sonraki Adımlar

1. **Backend klasörünü oluşturun**
2. **Temel Express.js server'ını kurun**
3. **PostgreSQL veritabanını kurun**
4. **Prisma schema'sını oluşturun**
5. **İlk API endpoint'lerini yazın**

Bu yol haritasını takip ederek, mevcut frontend'inizle uyumlu güçlü bir backend sistemi oluşturabilirsiniz. Hangi aşamadan başlamak istiyorsunuz? 