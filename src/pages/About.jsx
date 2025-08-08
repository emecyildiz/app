import { motion } from 'framer-motion'
import { Film, Users, Star, Heart, TrendingUp, Shield } from 'lucide-react'

const About = () => {
  const features = [
    {
      icon: Film,
      title: 'Geniş Film Arşivi',
      description: 'Binlerce film ve dizi arasından favorilerinizi keşfedin.',
    },
    {
      icon: Star,
      title: 'Detaylı Puanlama',
      description: 'Filmleri 10 üzerinden puanlayın ve diğer kullanıcıların puanlarını görün.',
    },
    {
      icon: Users,
      title: 'Sosyal Özellikler',
      description: 'Arkadaşlarınızla film listelerini paylaşın ve öneriler alın.',
    },
    {
      icon: Heart,
      title: 'Kişiselleştirilmiş Öneriler',
      description: 'İzleme geçmişinize göre size özel film önerileri alın.',
    },
    {
      icon: TrendingUp,
      title: 'Trend Takibi',
      description: 'En popüler ve trend olan filmleri anında keşfedin.',
    },
    {
      icon: Shield,
      title: 'Güvenli Platform',
      description: 'Verileriniz güvende, gizliliğinize önem veriyoruz.',
    },
  ]

  // Gerçek dışı istatistikler kaldırıldı; bu bölüm şimdilik gizlendi
  const stats = []

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              CinemaHub Hakkında
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Film tutkunları için tasarlanmış, modern ve kullanıcı dostu bir platform. 
              Binlerce film arasından favorilerinizi keşfedin, puanlayın ve paylaşın.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary-400">
              <Film className="w-8 h-8" />
              <span className="text-2xl font-bold">CinemaHub</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section removed until real data is available */}

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Özelliklerimiz</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              CinemaHub, film deneyiminizi zenginleştirmek için tasarlanmış özelliklerle dolu.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass rounded-xl p-6 hover:transform hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-dark-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">Misyonumuz</h2>
              <p className="text-gray-300 text-lg mb-6">
                CinemaHub olarak amacımız, film severleri bir araya getiren, 
                keşif yapmayı kolaylaştıran ve film deneyimini zenginleştiren 
                bir platform oluşturmak.
              </p>
              <p className="text-gray-300 text-lg mb-6">
                Kullanıcılarımızın film zevklerini keşfetmelerine, 
                benzer ilgi alanlarına sahip insanlarla bağlantı kurmalarına 
                ve yeni filmler keşfetmelerine yardımcı oluyoruz.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary-400" />
                  </div>
                  <span className="text-gray-300">
                    Kullanıcı dostu ve modern arayüz
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary-400" />
                  </div>
                  <span className="text-gray-300">
                    Güvenilir ve objektif puanlama sistemi
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary-400" />
                  </div>
                  <span className="text-gray-300">
                    Sürekli güncellenen film veritabanı
                  </span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass rounded-2xl p-8">
                <img
                  src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800"
                  alt="Cinema"
                  className="rounded-xl w-full"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl" />
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-12 text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Hemen Başlayın
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              CinemaHub'a katılın ve film dünyasının kapılarını aralayın. 
              Ücretsiz hesap oluşturun ve keşfe başlayın!
            </p>
            <button className="btn btn-primary text-lg px-8 py-3">
              Ücretsiz Katıl
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default About