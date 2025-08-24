import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Film, UserPlus, PlayCircle, User } from 'lucide-react'
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        className="relative h-screen flex items-center justify-center overflow-hidden hero-3d"
      >
        {/* 3D layers */}
        <motion.div
          className="absolute inset-0 tilt-container"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04)` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <div
            className="parallax-layer depth-30 maze-bg"
            style={{ backgroundImage: "url('/brand/arka_plan.jpg')" }}
          />
        </motion.div>

        <div className="relative z-10 text-center px-6">
          {isAuthenticated && user ? (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 mb-5">
                <User className="w-4 h-4 text-primary-300" />
                {displayName}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
                Kaldığın yerden devam et
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Popüler filmleri keşfet, favorilerine ekle ve değerlendirmelerini paylaş.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/movies" className="btn btn-primary text-lg px-8 py-3">
                  <PlayCircle className="w-5 h-5" />
                  Filmleri Keşfet
                </Link>
                <Link to="/profile" className="btn btn-ghost text-lg px-8 py-3">
                  <User className="w-5 h-5" />
                  Profilim
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                ratemet'e Hoş Geldiniz
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Film dünyasına katılın ve binlerce film arasından favorilerinizi keşfedin.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
                  <UserPlus className="w-5 h-5" />
                  Hemen Üye Ol
                </Link>
                <Link to="/login" className="btn btn-secondary text-lg px-8 py-3">
                  Giriş Yap
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

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
            <h2 className="text-4xl font-bold text-white mb-4">Özellikler</h2>
            <p className="text-gray-400 text-lg">
              ratemet'in sunduğu özellikler
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="glass p-6 rounded-lg text-center"
            >
              <Film className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Film Keşfi</h3>
              <p className="text-gray-300">
                Binlerce film arasından favorilerinizi keşfedin
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass p-6 rounded-lg text-center"
            >
              <Film className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Değerlendirme</h3>
              <p className="text-gray-300">
                İzlediğiniz filmleri değerlendirin ve yorum yapın
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="glass p-6 rounded-lg text-center"
            >
              <Film className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Topluluk</h3>
              <p className="text-gray-300">
                Diğer film tutkunlarıyla paylaşın
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-dark-100">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-12 text-center"
          >
            {isAuthenticated && user ? (
              <>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Bugün ne izlemek istersin?
                </h2>
                <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                  Editörün seçtikleri ve popüler yapımlar seni bekliyor.
                </p>
                <Link to="/movies" className="btn btn-primary text-lg px-8 py-3">
                  <PlayCircle className="w-5 h-5" />
                  Popüler Filmleri Gör
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-white mb-4">
                  Film Dünyasına Katılın
                </h2>
                <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                  Binlerce film arasından favorilerinizi keşfedin, değerlendirin ve diğer film tutkunlarıyla paylaşın.
                </p>
                <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
                  <UserPlus className="w-5 h-5" />
                  Hemen Üye Ol
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home