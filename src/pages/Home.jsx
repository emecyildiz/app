import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Film, UserPlus, PlayCircle, User, Star, Heart, TrendingUp, Sparkles, Zap, Shield, Award, Users, Clock, Search } from 'lucide-react'
import { useAuthStore } from '../store/newAuthStore'

const Home = () => {
  const { isAuthenticated, user, profile } = useAuthStore()
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Hoş geldin'
  
  const containerRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height
    const rotateY = (relX - 0.5) * 12 // left/right
    const rotateX = (0.5 - relY) * 8 // up/down
    setTilt({ x: rotateX, y: rotateY })
  }

  const resetTilt = () => setTilt({ x: 0, y: 0 })

  const features = [
    {
      icon: Film,
      title: 'Geniş Film ve Dizi Arşivi',
      description: 'TMDB entegrasyonu ile genişleyen bir film ve dizi kataloğu',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Sparkles,
      title: 'Akıllı Öneriler',
      description: 'Yapay zeka destekli kişiselleştirilmiş film önerileri',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Heart,
      title: 'Favori Listeler',
      description: 'İzlediklerinizi ve izlemek istediklerinizi organize edin',
      gradient: 'from-red-500 to-rose-500',
    },
    {
      icon: Users,
      title: 'Sosyal Platform',
      description: 'Film tutkunlarıyla paylaşımda bulun ve öneriler alın',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: TrendingUp,
      title: 'Güncel Trendler',
      description: 'En popüler ve trend olan filmleri anında keşfedin',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: Shield,
      title: 'Güvenli & Hızlı',
      description: 'Verileriniz güvende, yıldırım hızında performans',
      gradient: 'from-indigo-500 to-blue-500',
    },
  ]

  const stats = [
    { icon: Film, value: 'Geniş Arşiv', label: 'Film & Dizi', color: 'text-purple-400' },
    { icon: Users, value: 'Büyüyen Topluluk', label: 'Kullanıcı', color: 'text-blue-400' },
    { icon: Star, value: 'Yüksek Memnuniyet', label: 'Topluluk Puanları', color: 'text-yellow-400' },
    { icon: Clock, value: 'Her Zaman Erişim', label: 'Erişim', color: 'text-green-400' },
  ]

  const categories = [
    { name: 'Aksiyon', slug: 'action', emoji: '💥', gradient: 'from-red-600 to-orange-600' },
    { name: 'Komedi', slug: 'comedy', emoji: '😂', gradient: 'from-yellow-500 to-amber-500' },
    { name: 'Drama', slug: 'drama', emoji: '🎭', gradient: 'from-purple-600 to-pink-600' },
    { name: 'Bilim Kurgu', slug: 'science-fiction', emoji: '🚀', gradient: 'from-blue-600 to-cyan-600' },
    { name: 'Korku', slug: 'horror', emoji: '👻', gradient: 'from-gray-700 to-gray-900' },
    { name: 'Romantik', slug: 'romance', emoji: '💕', gradient: 'from-pink-500 to-rose-500' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-60 right-20 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>
      {/* Hero Section - Enhanced */}
      <section
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        className="relative min-h-screen flex items-center justify-center overflow-hidden hero-3d pt-20"
      >
        {/* 3D Background Layer */}
        <motion.div
          className="absolute inset-0 tilt-container"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04)` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <div
            className="parallax-layer depth-30 maze-bg"
            style={{ backgroundImage: `url(${import.meta.env.BASE_URL || ''}brand/arka_plan.jpg)` }}
          />
        </motion.div>

        <div className="relative z-10 text-center px-6 py-20">
          {isAuthenticated && user ? (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              {/* Welcome Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Hoş geldin, {displayName}!</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                Kaldığın Yerden{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Devam Et
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Son trend filmleri keşfet, favorilerine ekle ve toplulukla etkileşime geç.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/movies" 
                    className="btn bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-10 py-4 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/30"
                  >
                    <PlayCircle className="w-5 h-5" />
                    Filmleri Keşfet
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/profile" 
                    className="btn glass border border-white/20 text-white px-10 py-4 text-lg font-semibold rounded-xl"
                  >
                    <User className="w-5 h-5" />
                    Profilim
                  </Link>
                </motion.div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span>Güncel Puanlar</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-600" />
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span>Trend Filmler</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-600" />
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span>Kişisel Listeler</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Hero Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-5 py-2 mb-6"
              >
                <Award className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 font-medium">
                  Yeni nesil film platformu
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 leading-tight">
                Film Tutkunları İçin{' '}
                <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Özel Platform
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                Geniş bir katalogdan favorilerini keşfet, yapay zeka destekli öneriler al 
                ve film tutkunlarıyla deneyimlerini paylaş.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/register" 
                    className="btn bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-10 py-4 text-lg font-semibold rounded-xl shadow-lg shadow-purple-500/30"
                  >
                    <UserPlus className="w-5 h-5" />
                    Ücretsiz Başla
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link 
                    to="/movies" 
                    className="btn glass border border-white/20 text-white px-10 py-4 text-lg font-semibold rounded-xl"
                  >
                    <Search className="w-5 h-5" />
                    Filmleri Keşfet
                  </Link>
                </motion.div>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Anlık Erişim</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-600" />
                <div className="flex items-center gap-2 text-gray-400">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Güvenli Altyapı</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-600" />
                <div className="flex items-center gap-2 text-gray-400">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span>Tamamen Ücretsiz</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="glass rounded-lg md:rounded-2xl p-3 md:p-6 text-center border border-white/5 hover:border-white/20 transition-all duration-300"
                >
                  <Icon className={`w-8 md:w-10 h-8 md:h-10 ${stat.color} mx-auto mb-2 md:mb-3`} />
                  <div className="text-lg md:text-4xl font-extrabold text-white mb-1 line-clamp-2 break-words">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-xs md:text-sm font-medium line-clamp-2">
                    {stat.label}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
                Kategoriler
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Her Zevke Uygun{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                İçerikler
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Aksiyon dolu maceralardan duygusal dramalara kadar her türden film seni bekliyor
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/movies?genre=${category.slug}`}
                className="group cursor-pointer no-underline"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="h-full"
                >
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.gradient} p-6 h-32 flex flex-col items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300`}>
                    <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform duration-300">
                      {category.emoji}
                    </div>
                    <div className="text-white font-semibold text-sm text-center">
                      {category.name}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
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
                Özellikler
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Neden{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ratemet
              </span>
              ?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Modern teknoloji ve kullanıcı odaklı tasarımla film deneyiminizi bir üst seviyeye taşıyoruz
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
                  
                  <div className={`relative w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3">
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
            {isAuthenticated && user ? (
              <>
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 opacity-90" />
                
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
                      <TrendingUp className="w-4 h-4 text-white" />
                      <span className="text-sm text-white font-medium">
                        Yeni Filmler Eklendi
                      </span>
                    </div>
                    
                    <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
                      Bugün Ne İzlemek İstersin?
                    </h2>
                    <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                      En trend filmler, editörün seçtikleri ve senin için özel öneriler seni bekliyor.
                    </p>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link 
                        to="/movies" 
                        className="btn bg-white text-purple-600 hover:bg-gray-100 px-12 py-4 text-lg font-bold rounded-xl shadow-xl inline-flex items-center gap-3"
                      >
                        <PlayCircle className="w-6 h-6" />
                        Filmleri Keşfet
                      </Link>
                    </motion.div>
                    
                    {/* Trust Indicators */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-white" />
                        <span>Geniş film arşivi</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-white/50" />
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Büyüyen topluluk</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-white/50" />
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        <span>Her Gün Yeni İçerik</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </>
            ) : (
              <>
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
                      Film Dünyasına Katıl!
                    </h2>
                    <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                      Geniş film arşivi, kişiselleştirilmiş öneriler ve sosyal özellikler seni bekliyor. 
                      Hemen kayıt ol, keşfetmeye başla!
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link 
                          to="/register" 
                          className="btn bg-white text-purple-600 hover:bg-gray-100 px-10 py-4 text-lg font-bold rounded-xl shadow-xl inline-flex items-center gap-3"
                        >
                          <Sparkles className="w-5 h-5" />
                          Ücretsiz Kayıt Ol
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link 
                          to="/movies" 
                          className="btn bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-10 py-4 text-lg font-bold rounded-xl inline-flex items-center gap-3"
                        >
                          <Film className="w-5 h-5" />
                          Filmleri İncele
                        </Link>
                      </motion.div>
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
                        <span>Topluluk puanları</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home