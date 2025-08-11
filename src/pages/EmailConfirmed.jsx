import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Film } from 'lucide-react'
import { useAuthStore } from '../store/newAuthStore'

const EmailConfirmed = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { initializeAuth } = useAuthStore()
  const [status, setStatus] = useState('loading') // loading, success, error

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get tokens from URL
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')

        if (type === 'signup' && accessToken) {
          // Re-initialize auth to get the updated session
          await initializeAuth()
          setStatus('success')
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login', { 
              state: { message: 'Email adresiniz doğrulandı! Şimdi giriş yapabilirsiniz.' }
            })
          }, 3000)
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('Email confirmation error:', error)
        setStatus('error')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, initializeAuth, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Film className="w-10 h-10 text-primary-500" />
          <span className="text-2xl font-bold text-white">CinemaHub</span>
        </div>

        {/* Content Card */}
        <div className="glass rounded-2xl p-8">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-6"></div>
              <h1 className="text-2xl font-bold text-white mb-4">
                Email Doğrulanıyor...
              </h1>
              <p className="text-gray-400">
                Lütfen bekleyin, email adresiniz doğrulanıyor.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-white mb-4">
                Email Doğrulandı! ✅
              </h1>
              <p className="text-gray-400 mb-6">
                Email adresiniz başarıyla doğrulandı. Artık hesabınızı kullanabilirsiniz.
              </p>
              <p className="text-sm text-gray-500">
                3 saniye içinde giriş sayfasına yönlendirileceksiniz...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-white mb-4">
                Doğrulama Hatası
              </h1>
              <p className="text-gray-400 mb-6">
                Email doğrulaması sırasında bir hata oluştu. Lütfen tekrar deneyin.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary w-full"
              >
                Giriş Sayfasına Dön
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default EmailConfirmed
