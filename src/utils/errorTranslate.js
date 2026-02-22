// Translate common error messages from English to Turkish
export const translateError = (errorMessage) => {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return 'Bilinmeyen hata oluştu'
  }

  const translations = {
    'User already registered': 'Bu kullanıcı zaten kayıtlı',
    'Invalid login credentials': 'E-posta veya şifre hatalı',
    'Email not confirmed': 'E-posta adresiniz doğrulanmamış',
    'User not found': 'Kullanıcı bulunamadı',
    'Password too short': 'Şifre çok kısa',
    'Invalid email': 'Geçersiz e-posta adresi',
    'Email already in use': 'Bu e-posta zaten kullanımda',
    'Unable to validate email address': 'E-posta adresi doğrulanamadı',
    'Same password': 'Yeni şifre eski şifre ile aynı',
    'New password should be different': 'Yeni şifre eski şifre ile aynı',
    'Invalid Refresh Token': 'Oturum süresi doldu, lütfen tekrar giriş yapın',
    'Refresh Token Not Found': 'Oturum bulunamadı, lütfen tekrar giriş yapın',
    'Unexpected end of JSON input': 'Veri işlenirken hata oluştu',
    'Network request failed': 'Ağ bağlantısı başarısız, lütfen internet bağlantınızı kontrol edin',
    'Failed to fetch': 'Bağlantı sırasında hata oluştu',
    'unauthorized': 'Bu işlemi yapma yetkiniz yok',
    'Unauthorized': 'Bu işlemi yapma yetkiniz yok',
    'no rows': 'Sonuç bulunamadı',
    'No rows returned': 'Sonuç bulunamadı',
    'PGRST116': 'Kayıt bulunamadı',
    'duplicate key value': 'Bu veri zaten mevcut',
    'violates unique constraint': 'Bu veri zaten mevcut',
  }

  // Check for exact match first
  for (const [en, tr] of Object.entries(translations)) {
    if (errorMessage.toLowerCase().includes(en.toLowerCase())) {
      return tr
    }
  }

  // If no match found, return original message
  // But if it looks like English, try to make it user-friendly
  if (errorMessage.length > 0) {
    // Remove common prefixes
    let cleaned = errorMessage
      .replace(/Error: /gi, '')
      .replace(/^[A-Z0-9]+: /, '')
      .trim()

    // If it's still too technical, return generic message
    if (cleaned.length > 100 || /^[A-Z_]+|PGRST|[0-9]{4}/.test(cleaned)) {
      return 'İşlem sırasında bir hata oluştu'
    }

    return cleaned
  }

  return 'Bilinmeyen hata oluştu'
}
