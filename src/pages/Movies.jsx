import { motion } from 'framer-motion'
import { Film } from 'lucide-react'

const Movies = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Film className="w-16 h-16 text-primary-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Filmler Sayfası
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Film API'si henüz bağlanmadı. Gerçek film API'si bağlandığında burada filmler görünecek.
          </p>
          <div className="glass p-8 rounded-lg max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Yakında Gelecek Özellikler
            </h3>
            <ul className="text-gray-300 space-y-2 text-left">
              <li>• Film arama ve filtreleme</li>
              <li>• Film detayları ve yorumlar</li>
              <li>• Favori filmler listesi</li>
              <li>• Film değerlendirme sistemi</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Movies