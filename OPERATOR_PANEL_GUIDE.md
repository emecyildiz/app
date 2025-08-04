# Operatör Paneli Kullanım Kılavuzu

## Genel Bakış

Uygulamaya operatör rolü ve operatör paneli eklendi. Operatörler kullanıcı hesaplarını yönetebilir ve görüntüleyebilir.

## Operatör Özellikleri

### 1. Operatör Paneli Erişimi
- Operatörler `/operator` adresinden panele erişebilir
- Sadece operatör rolündeki kullanıcılar panele giriş yapabilir
- Navbar'da "Operatör Paneli" linki görünür

### 2. Operatör Yetkileri
- **Kullanıcı Görüntüleme**: Tüm kullanıcıları listeleme
- **Kullanıcı Düzenleme**: Kullanıcı profil bilgilerini güncelleme
- **Kullanıcı Silme**: Normal kullanıcıları silme (admin ve operatörleri silemez)
- **Profil Yönetimi**: Kendi operatör profilini düzenleme

### 3. Operatör Paneli Sekmeleri

#### Genel Bakış
- Operatör bilgileri
- Sistem istatistikleri
- Hızlı işlem butonları

#### Kullanıcı Yönetimi
- Tüm kullanıcıları tablo halinde listeleme
- Kullanıcı detaylarını görüntüleme
- Kullanıcı bilgilerini düzenleme
- Kullanıcı silme (sadece normal kullanıcılar)

#### Profil Ayarları
- Operatör kendi profilini düzenleyebilir
- Avatar, isim, e-posta, konum güncelleme

## Test Operatör Hesapları

### Operatör 1
- **E-posta**: operator@example.com
- **Şifre**: operator123
- **Ad**: Ahmet Yılmaz
- **Kullanıcı Adı**: ahmetyilmaz

### Operatör 2
- **E-posta**: operator2@example.com
- **Şifre**: operator456
- **Ad**: Fatma Demir
- **Kullanıcı Adı**: fatmademir

## Admin Paneli Güncellemeleri

Admin paneline de kullanıcı yönetimi özelliği eklendi:

### Yeni Sekme: Kullanıcı Yönetimi
- Admin tüm kullanıcıları görüntüleyebilir
- Kullanıcı düzenleme ve silme yetkisi
- Operatör yönetimi (ekleme/kaldırma) devam ediyor

## Güvenlik

- Operatörler sadece normal kullanıcıları silebilir
- Admin ve diğer operatörleri silemezler
- Operatörler kendi rollerini değiştiremez
- Sadece operatör rolündeki kullanıcılar panele erişebilir

## Teknik Detaylar

### Yeni Dosyalar
- `src/pages/OperatorDashboard.jsx` - Operatör paneli
- `OPERATOR_PANEL_GUIDE.md` - Bu kullanım kılavuzu

### Güncellenen Dosyalar
- `src/App.jsx` - Operatör route'u eklendi
- `src/components/Navbar.jsx` - Operatör paneli linki
- `src/store/authStore.js` - Operatör yetkileri ve test hesapları
- `src/pages/AdminDashboard.jsx` - Kullanıcı yönetimi sekmesi

### Operatör Yetkileri
```javascript
// Operatörler şu işlemleri yapabilir:
- getAllUsers() // Tüm kullanıcıları görüntüleme
- updateUserProfile() // Kullanıcı profilini güncelleme
- deleteUser() // Kullanıcı silme (sadece normal kullanıcılar)
```

## Kullanım Senaryoları

1. **Operatör Girişi**: Test hesaplarından biriyle giriş yapın
2. **Kullanıcı Listesi**: Operatör panelinde "Kullanıcı Yönetimi" sekmesine gidin
3. **Kullanıcı Düzenleme**: Kullanıcı satırındaki "Düzenle" butonuna tıklayın
4. **Kullanıcı Silme**: Normal kullanıcılar için "Sil" butonu görünür
5. **Profil Düzenleme**: "Profil Ayarları" sekmesinden kendi profilini düzenleyebilir 