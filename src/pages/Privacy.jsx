import { motion } from 'framer-motion'
import { Lock, Eye, Database, Shield, UserCheck, RefreshCw, Mail } from 'lucide-react'
import { APP_NAME } from '../config/appConfig'

const Privacy = () => {
  return (
    <div className="min-h-screen pt-20 pb-16 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full px-5 py-2 mb-6">
            <Lock className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Gizlilik ve Güvenlik</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Gizlilik Politikası
          </h1>
          <p className="text-gray-400 text-lg">
            Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl p-8 md:p-12 border border-white/5 space-y-8"
        >
          {/* Section 1 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">1. Giriş</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    {APP_NAME} olarak, kullanıcılarımızın gizliliğini korumayı öncelik olarak görüyoruz. 
                    Bu gizlilik politikası, hangi kişisel verileri topladığımızı, nasıl kullandığımızı 
                    ve koruduğumuzu açıklamaktadır.
                  </p>
                  <p>
                    Platformumuzu kullanarak, bu gizlilik politikasında açıklanan uygulamaları 
                    kabul etmiş olursunuz.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Database className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">2. Topladığımız Bilgiler</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>Platformumuzda aşağıdaki bilgileri toplamaktayız:</p>
                  
                  <div className="space-y-4 mt-4">
                    <div className="pl-4 border-l-2 border-purple-500/30">
                      <h3 className="font-semibold text-white mb-2">Hesap Bilgileri</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-gray-400">
                        <li>E-posta adresi</li>
                        <li>Kullanıcı adı</li>
                        <li>Şifre (şifrelenmiş)</li>
                        <li>Profil bilgileri (isim, biyografi, konum - isteğe bağlı)</li>
                      </ul>
                    </div>

                    <div className="pl-4 border-l-2 border-blue-500/30">
                      <h3 className="font-semibold text-white mb-2">Kullanım Bilgileri</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-gray-400">
                        <li>İzlediğiniz filmler ve puanlamalarınız</li>
                        <li>Yazdığınız yorumlar</li>
                        <li>Favori listeleriniz</li>
                        <li>Arkadaşlık bağlantılarınız</li>
                        <li>Platform içi aktiviteleriniz</li>
                      </ul>
                    </div>

                    <div className="pl-4 border-l-2 border-green-500/30">
                      <h3 className="font-semibold text-white mb-2">Teknik Bilgiler</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-gray-400">
                        <li>IP adresi</li>
                        <li>Tarayıcı türü ve versiyonu</li>
                        <li>Cihaz bilgileri</li>
                        <li>Platform kullanım istatistikleri</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Eye className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">3. Bilgilerin Kullanımı</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>Topladığımız bilgileri şu amaçlarla kullanırız:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Hesabınızı oluşturmak ve yönetmek</li>
                    <li>Size kişiselleştirilmiş film önerileri sunmak</li>
                    <li>Platformun işlevselliğini sağlamak ve geliştirmek</li>
                    <li>Kullanıcı deneyimini iyileştirmek</li>
                    <li>Güvenlik ve dolandırıcılık önleme</li>
                    <li>Yasal gereklilikleri yerine getirmek</li>
                  </ul>
                  <p className="mt-3">
                    Kişisel bilgilerinizi asla üçüncü taraflara satmıyoruz veya reklam amaçlı 
                    kullanmıyoruz.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">4. Veri Güvenliği</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    Verilerinizin güvenliği bizim için son derece önemlidir. Bilgilerinizi korumak 
                    için endüstri standartlarında güvenlik önlemleri alıyoruz:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>SSL/TLS şifreleme ile güvenli veri iletimi</li>
                    <li>Şifrelerin güvenli hash algoritmaları ile saklanması</li>
                    <li>Düzenli güvenlik güncellemeleri</li>
                    <li>Sınırlı erişim kontrolleri</li>
                    <li>Güvenlik duvarları ve izleme sistemleri</li>
                  </ul>
                  <p className="mt-3">
                    Ancak, internet üzerinden veri iletiminin %100 güvenli olduğu garanti edilemez. 
                    Güvenliğiniz için hesap şifrenizi kimseyle paylaşmamanızı öneririz.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">5. Kullanıcı Hakları</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>Kişisel verileriniz üzerinde aşağıdaki haklara sahipsiniz:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Erişim Hakkı:</strong> Hangi verilerimizin saklandığını öğrenebilirsiniz</li>
                    <li><strong>Düzeltme Hakkı:</strong> Yanlış verileri düzeltme talebinde bulunabilirsiniz</li>
                    <li><strong>Silme Hakkı:</strong> Hesabınızı ve verilerinizi silebilirsiniz</li>
                    <li><strong>İtiraz Hakkı:</strong> Veri işleme faaliyetlerine itiraz edebilirsiniz</li>
                    <li><strong>Taşınabilirlik Hakkı:</strong> Verilerinizi yapılandırılmış formatta alabilirsiniz</li>
                  </ul>
                  <p className="mt-3">
                    Bu haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">6. Çerezler (Cookies)</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    Platformumuz, kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Gerekli Çerezler:</strong> Oturum yönetimi ve kimlik doğrulama</li>
                    <li><strong>Tercih Çerezleri:</strong> Dil ve tema ayarlarınızın hatırlanması</li>
                    <li><strong>Performans Çerezleri:</strong> Platform performansının izlenmesi</li>
                  </ul>
                  <p className="mt-3">
                    Tarayıcınızın ayarlarından çerezleri yönetebilir veya reddedebilirsiniz. 
                    Ancak bu durumda bazı özellikler düzgün çalışmayabilir.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">7. Üçüncü Taraf Hizmetler</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    Platformumuz şu üçüncü taraf hizmetleri kullanmaktadır:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Supabase:</strong> Kimlik doğrulama ve veritabanı yönetimi</li>
                    <li><strong>TMDB (The Movie Database):</strong> Film verileri ve görselleri</li>
                    <li><strong>Google OAuth:</strong> Google hesabıyla giriş (isteğe bağlı)</li>
                  </ul>
                  <p className="mt-3">
                    Bu hizmetlerin kendi gizlilik politikaları bulunmaktadır. Kullanım öncesinde 
                    ilgili politikaları incelemenizi öneririz.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">8. Değişiklikler</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler 
                    olması durumunda kullanıcılarımızı bilgilendireceğiz.
                  </p>
                  <p>
                    Değişikliklerin yürürlüğe girme tarihi, politikanın başında belirtilecektir.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Mail className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">9. İletişim</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    Gizlilik politikamız veya verilerinizle ilgili sorularınız için bizimle 
                    iletişime geçebilirsiniz:
                  </p>
                  <p className="text-primary-400">
                    E-posta: emecyildiz@gmail.com
                  </p>
                  <p className="mt-3">
                    Veri taleplerinize en geç 30 gün içinde yanıt vermeye çalışıyoruz.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8 text-gray-400 text-sm"
        >
          <p>
            Bu gizlilik politikası {APP_NAME} platformu için geçerlidir.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Privacy
