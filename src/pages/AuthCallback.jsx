import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/newAuthStore'
import { supabase } from '../config/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const AuthCallback = () => {
  const navigate = useNavigate()
  const { initializeAuth, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // OAuth state problemini çöz - URL'deki hash'i temizle
        window.history.replaceState({}, document.title, window.location.pathname)

        // Supabase session'ı al (OAuth'dan gelen token URL'de)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        if (!session) {
          // Session almıyorsa, initializeAuth'ı çağır
          await initializeAuth()
        }

        // Biraz bekle state'in settle olması için
        await new Promise(r => setTimeout(r, 1000))

        // Başarısı kontrol et ve yönlendir
        if (isAuthenticated || session?.user?.id) {
          toast.success('Giriş başarılı!')
          navigate('/', { replace: true })
        } else {
          throw new Error('Auth verification failed')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error('Giriş sırasında bir hata oluştu: ' + (error?.message || 'Bilinmeyen hata'))
        
        // Hata durumunda login'e dön
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2000)
      }
    }

    handleCallback()
  }, [])

  // Eğer giriş başarılı oldu ise hemen yönlendir
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="text-gray-400 mt-4">Giriş yapılıyor...</p>
      </div>
    </div>
  )
}

export default AuthCallback
