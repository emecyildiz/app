import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Film, UserPlus } from 'lucide-react'

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-dark-900"></div>
        
        <div className="relative z-10 text-center">
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
            <h2 className="text-4xl font-bold text-white mb-4">
              Film Dünyasına Katılın
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Binlerce film arasından favorilerinizi keşfedin, değerlendirin ve diğer film tutkunlarıyla paylaşın.
            </p>
            <Link to="/register" className="btn btn-primary text-lg px-8 py-3">
              Hemen Üye Ol
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home