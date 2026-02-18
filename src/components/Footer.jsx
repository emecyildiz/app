import { Film, Heart, Github, Twitter, Mail } from 'lucide-react'
import { APP_NAME, APP_LOGO_URL } from '../config/appConfig'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-dark-200 border-t border-dark-500 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
                                            <img src="/brand/ratemet-logo.svg" alt={APP_NAME} className="h-10 w-auto" />
            </Link>
            <p className="text-gray-400 text-sm">
              Film tutkunları için modern bir değerlendirme platformu. 
              En güncel filmler, yorumlar ve puanlamalar.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link to="/movies" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Filmler
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Hakkında
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Profil
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kategoriler</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/movies?genre=action" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Aksiyon
                </Link>
              </li>
              <li>
                <Link to="/movies?genre=drama" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Dram
                </Link>
              </li>
              <li>
                <Link to="/movies?genre=comedy" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Komedi
                </Link>
              </li>
              <li>
                <Link to="/movies?genre=thriller" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Gerilim
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Bizi Takip Edin</h3>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-dark-300 flex items-center justify-center text-gray-400 hover:bg-primary-500 hover:text-white transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-dark-300 flex items-center justify-center text-gray-400 hover:bg-primary-500 hover:text-white transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                                 href="mailto:info@ratemet.com"
                className="w-10 h-10 rounded-lg bg-dark-300 flex items-center justify-center text-gray-400 hover:bg-primary-500 hover:text-white transition-all"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-dark-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © {currentYear} {APP_NAME}. Tüm hakları saklıdır.
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-primary-500" /> by {APP_NAME} Team
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer