import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp, Star, Film } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import toast from 'react-hot-toast'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

import MovieCard from '../components/MovieCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { movieService } from '../services/movieService'

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState([])
  const [featuredMovies, setFeaturedMovies] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trending, featured] = await Promise.all([
          movieService.getTrendingMovies(),
          movieService.getMovies(1, 6),
        ])
        setTrendingMovies(trending || [])
        setFeaturedMovies(featured?.movies || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Filmler yüklenirken bir hata oluştu')
        // Fallback'leri set et
        setTrendingMovies([])
        setFeaturedMovies([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          className="h-full"
        >
          {(trendingMovies || []).slice(0, 5).map((movie) => (
            <SwiperSlide key={movie.id}>
              <div className="relative h-full">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={movie.backdrop}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="relative h-full container mx-auto px-4 flex items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl"
                  >
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 text-shadow-lg">
                      {movie.title}
                    </h1>
                    
                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        <span className="text-2xl font-semibold text-white">{movie.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-300">{new Date(movie.releaseDate).getFullYear()}</span>
                      <span className="text-gray-300">{movie.runtime} dk</span>
                    </div>

                    <p className="text-lg text-gray-200 mb-8 line-clamp-3">
                      {movie.description}
                    </p>

                    <div className="flex gap-4">
                      <Link
                        to={`/movies/${movie.id}`}
                        className="btn btn-primary text-lg px-8 py-3"
                      >
                        <Film className="w-5 h-5" />
                        Detayları Gör
                      </Link>
                      <button className="btn btn-secondary text-lg px-8 py-3">
                        Fragmanı İzle
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Trending Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary-500" />
                <h2 className="text-4xl font-bold text-white">Trend Filmler</h2>
              </div>
              <Link
                to="/movies"
                className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <span>Tümünü Gör</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {(trendingMovies || []).slice(0, 10).map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-20 bg-dark-100">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Öne Çıkan Filmler</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              En yüksek puanlı ve en çok izlenen filmler arasından sizin için seçtiklerimiz
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featuredMovies || []).map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} index={index} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/movies" className="btn btn-primary text-lg px-8 py-3">
              <Film className="w-5 h-5" />
              Tüm Filmleri Keşfet
            </Link>
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