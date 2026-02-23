import { motion } from 'framer-motion'
import { Film, Users, Star, Heart, TrendingUp, Shield, Sparkles, Zap, Award, Clock } from 'lucide-react'
import { APP_NAME } from '../config/appConfig'

const About = () => {
  const features = [
    {
      icon: Film,
      title: 'Geniş Film Arşivi',
      description: 'TMDB entegrasyonu ile dünya genelinden genişleyen film ve dizi kataloğu.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Sparkles,
      title: 'Yapay Zeka Önerileri',
      description: 'İzleme geçmişinizi analiz eden akıllı algoritma ile size özel film önerileri.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Sosyal Deneyim',
      description: 'Film listelerini paylaşın, yorumları okuyun ve toplulukla etkileşime geçin.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Heart,
      title: 'Favori Listeleri',
      description: 'İzlediğiniz, izlemek istediğiniz ve favorilerinizi ayrı listelerde düzenleyin.',
      gradient: 'from-red-500 to-rose-500',
    },
    {
      icon: TrendingUp,
      title: 'Güncel Trendler',
      description: 'Dünya genelinde şu an trend olan filmler ve dizileri keşfedin.',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: Shield,
      title: 'Güvenli & Hızlı',
      description: 'Verileriniz şifrelenmiş, modern altyapı ile yıldırım hızında deneyim.',
      gradient: 'from-indigo-500 to-blue-500',
    },
  ]

  const stats = [
    {
      icon: Film,
      value: 'Geniş Arşiv',
      label: 'Film & Dizi',
      color: 'text-purple-400',
    },
    {
      icon: Users,
      value: 'Büyüyen Topluluk',
      label: 'Kullanıcı',
      color: 'text-blue-400',
    },
    {
      icon: Star,
      value: 'Topluluk Geri Bildirimi',
      label: 'Değerlendirme',
      color: 'text-yellow-400',
    },
    {
      icon: Clock,
      value: 'Sürekli Erişim',
      label: 'Aktif Sistem',
      color: 'text-green-400',
    },
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Ücretsiz Hesap Oluştur',
      description: 'Sadece e-posta adresiniz ile hızlıca kayıt olun.',
    },
    {
      step: '02',
      title: 'Film Keşfet & İzle',
      description: 'Geniş katalogda arama yapın veya önerilere göz atın.',
    },
    {
      step: '03',
      title: 'Değerlendir & Paylaş',
      description: 'İzlediklerinizi puanlayın, listelere ekleyin ve arkadaşlarınızla paylaşın.',
    },
  ]

  const testimonials = [
    {
      name: 'Ahmet Yılmaz',
      role: 'Film Tutkunu',
      comment: 'En sevdiğim film platformu! Arayüz çok şık ve öneriler gerçekten işe yarıyor.',
      avatar: 'AY',
      rating: 5,
    },
    {
      name: 'Zeynep Kaya',
      role: 'Sinema Eleştirmeni',
      comment: 'Profesyonel ve kullanıcı dostu. Film arşivi gerçekten çok geniş.',
      avatar: 'ZK',
      rating: 5,
    },
    {
      name: 'Mehmet Demir',
      role: 'Dizi Bağımlısı',
      comment: 'İzlemek istediğim dizileri listelerde düzenleyebiliyorum. Harika!',
      avatar: 'MD',
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen pt-20 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section - Enhanced */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-5 py-2 mb-6"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">
                Yeni nesil film platformu
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Filmin{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Büyüsünü
              </span>
              <br />
              Yeniden Keşfet
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
              {APP_NAME}, yapay zeka destekli öneriler ve genişleyen film arşivi ile 
              sinema deneyiminizi bir üst seviyeye taşıyor.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/30"
              >
                <Sparkles className="w-5 h-5 inline mr-2" />
                Hemen Başla
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn glass border border-white/20 text-white px-8 py-4 text-lg font-semibold rounded-xl"
              >
                <Film className="w-5 h-5 inline mr-2" />
                Filmleri Keşfet
              </motion.button>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Hızlı & Güçlü</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-600" />
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Güvenli Altyapı</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-600" />
              <div className="flex items-center gap-2 text-gray-400">
                <Award className="w-4 h-4 text-blue-400" />
                <span>Ücretsiz Kullanım</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass rounded-2xl p-6 text-center hover:transform hover:scale-105 transition-all duration-300 border border-white/5"
                >
                  <Icon className={`w-10 h-10 ${stat.color} mx-auto mb-3`} />
                  <div className="text-4xl font-extrabold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
                Özellikler
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Neden{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
              ?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Modern teknoloji ve kullanıcı odaklı tasarım ile sinema deneyiminizi zenginleştiriyoruz.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className="group relative glass rounded-2xl p-8 hover:border-white/20 transition-all duration-300 border border-white/5"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                  
                  <div className={`relative w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section - New */}
      <section className="py-24 bg-dark-100/50 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                Nasıl Çalışır
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              3 Basit Adımda Başlayın
            </h2>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connection Lines */}
              <div className="hidden md:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-blue-500/50" style={{ top: '3rem' }} />
              
              {howItWorks.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Step Number */}
                  <div className="relative z-10 w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <span className="text-3xl font-bold text-white">
                      {item.step}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - New */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-green-400 uppercase tracking-wider">
                Kullanıcı Yorumları
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Kullanıcılarımız Ne Diyor?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 border border-white/5"
              >
                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.comment}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section - Enhanced */}
      <section className="py-24 bg-dark-100/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-block mb-4">
                <span className="text-sm font-semibold text-pink-400 uppercase tracking-wider">
                  Vizyonumuz
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Sinemayı{' '}
                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Herkes İçin
                </span>
                {' '}Erişilebilir Kılmak
              </h2>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                {APP_NAME} olarak, film tutkunlarını bir araya getiren, 
                keşfi kolaylaştıran ve sinema deneyimini zenginleştiren 
                yeni nesil bir platform oluşturmanın peşindeyiz.
              </p>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Yapay zeka destekli öneriler, kapsamlı film veritabanı ve 
                sosyal özelliklerimizle, film izleme deneyiminizi kişiselleştiriyoruz.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Hızlı & Sezgisel</h4>
                    <p className="text-gray-400 text-sm">
                      Modern arayüz ve optimize edilmiş performans
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Akıllı Öneriler</h4>
                    <p className="text-gray-400 text-sm">
                      Size özel yapay zeka destekli film önerileri
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Güvenli & Özel</h4>
                    <p className="text-gray-400 text-sm">
                      Verileriniz şifrelenmiş ve güvende
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative glass rounded-3xl p-4 border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80"
                  alt="Cinema Experience"
                  className="rounded-2xl w-full shadow-2xl"
                />
                
                {/* Floating Stats Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="absolute -bottom-6 -left-6 glass rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">Yüksek Puan</div>
                      <div className="text-xs text-gray-400">Kullanıcı Puanı</div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="absolute -top-6 -right-6 glass rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">İstikrarlı</div>
                      <div className="text-xs text-gray-400">Büyüme</div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 opacity-90" />
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
            
            {/* Content */}
            <div className="relative px-8 py-16 md:py-20 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                  <Award className="w-4 h-4 text-white" />
                  <span className="text-sm text-white font-medium">
                    Tamamen Ücretsiz
                  </span>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
                  Hemen Keşfetmeye Başla!
                </h2>
                <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                  Geniş film arşivi, kişiselleştirilmiş öneriler ve sosyal özellikler sizi bekliyor. 
                  Ücretsiz hesap oluşturun, sinema dünyasına dalın.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn bg-white text-purple-600 hover:bg-gray-100 px-10 py-4 text-lg font-bold rounded-xl shadow-xl"
                  >
                    <Sparkles className="w-5 h-5 inline mr-2" />
                    Ücretsiz Kayıt Ol
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-10 py-4 text-lg font-bold rounded-xl"
                  >
                    <Film className="w-5 h-5 inline mr-2" />
                    Daha Fazla Bilgi
                  </motion.button>
                </div>
                
                {/* Trust Indicators */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>SSL Güvenli</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/50" />
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Büyüyen topluluk</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/50" />
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span>Olumlu geri bildirim</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default About