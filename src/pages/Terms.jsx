import { motion } from 'framer-motion'
import { FileText, Shield, AlertCircle, Scale } from 'lucide-react'
import { APP_NAME } from '../config/appConfig'

const Terms = () => {
  return (
    <div className="min-h-screen pt-20 pb-16 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-5 py-2 mb-6">
            <Scale className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Yasal Bilgiler</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Kullanım Koşulları
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
              <FileText className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">1. Genel Koşullar</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    {APP_NAME} platformunu kullanarak, aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız. 
                    Bu koşulları kabul etmiyorsanız, lütfen platformumuzu kullanmayın.
                  </p>
                  <p>
                    Platformumuz, kullanıcılara film keşfetme, değerlendirme ve paylaşma imkanı sunan 
                    bir topluluk platformudur. Hizmetlerimiz tamamen ücretsizdir.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">2. Kullanıcı Sorumlulukları</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>Platformumuzu kullanırken aşağıdaki kurallara uymayı kabul edersiniz:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Doğru ve güncel bilgiler sağlamak</li>
                    <li>Hesap güvenliğinizi sağlamak ve şifrenizi korumak</li>
                    <li>Yasadışı, zararlı veya saldırgan içerik paylaşmamak</li>
                    <li>Diğer kullanıcıların haklarına saygı göstermek</li>
                    <li>Telif haklarını ihlal eden içerik paylaşmamak</li>
                    <li>Platformu kötüye kullanmamak veya spam göndermemek</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">3. İçerik ve Fikri Mülkiyet</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    Platformda paylaştığınız yorumlar, puanlamalar ve diğer içerikler için sorumluluğu 
                    kabul edersiniz. Paylaştığınız içeriklerin telif haklarını ihlal etmediğinden 
                    emin olmalısınız.
                  </p>
                  <p>
                    Film bilgileri ve görselleri The Movie Database (TMDB) API'si aracılığıyla sağlanmaktadır. 
                    Bu içerikler üzerinde {APP_NAME} platformunun hiçbir hak iddiası bulunmamaktadır.
                  </p>
                  <p>
                    Platformda paylaştığınız içerikleri, {APP_NAME} platformu üzerinde kullanma, 
                    yayınlama ve gösterme hakkını bize vermiş olursunuz.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Scale className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">4. Hizmet Kapsamı ve Sınırlamalar</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    {APP_NAME} platformu "olduğu gibi" sunulmaktadır. Hizmetin kesintisiz veya hatasız 
                    olacağını garanti etmemekteyiz.
                  </p>
                  <p>
                    Platform içeriğini, özelliklerini ve kullanılabilirliğini önceden haber vermeksizin 
                    değiştirme, askıya alma veya sonlandırma hakkını saklı tutarız.
                  </p>
                  <p>
                    Kullanım koşullarını ihlal eden hesapları uyarı vermeksizin askıya alma veya 
                    silme hakkımız bulunmaktadır.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <FileText className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">5. Sorumluluk Reddi</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    {APP_NAME}, kullanıcıların paylaştığı içeriklerden sorumlu değildir. 
                    Kullanıcı içerikleri, ilgili kullanıcıların görüşlerini yansıtmaktadır.
                  </p>
                  <p>
                    Platformun kullanımından veya kullanılamamasından kaynaklanan doğrudan veya 
                    dolaylı zararlardan sorumlu tutulamayız.
                  </p>
                  <p>
                    Üçüncü taraf bağlantıları ve entegrasyonlardan kaynaklanan sorunlardan 
                    {APP_NAME} sorumlu değildir.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">6. Değişiklikler</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    Bu kullanım koşullarını dilediğimiz zaman değiştirme hakkını saklı tutarız. 
                    Önemli değişiklikler olması durumunda kullanıcılar bilgilendirilecektir.
                  </p>
                  <p>
                    Değişiklikler yayınlandıktan sonra platformu kullanmaya devam etmeniz, 
                    güncellenmiş koşulları kabul ettiğiniz anlamına gelir.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">7. İletişim</h2>
                <div className="text-gray-300 space-y-3 leading-relaxed">
                  <p>
                    Bu kullanım koşulları hakkında sorularınız varsa, bizimle iletişime geçebilirsiniz:
                  </p>
                  <p className="text-primary-400">
                    E-posta: emecyildiz@gmail.com
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
            Bu kullanım koşulları {APP_NAME} platformu için geçerlidir.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Terms
