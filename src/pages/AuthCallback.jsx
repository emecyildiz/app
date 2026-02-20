import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/newAuthStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const AuthCallback = () => {
  const navigate = useNavigate()
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Initialize auth to capture the OAuth session
        await initializeAuth()
        
        // Wait a moment for state to settle
        setTimeout(() => {
          toast.success('Giriş başarılı!')
          navigate('/', { replace: true })
        }, 500)
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error('Giriş sırasında bir hata oluştu')
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [initializeAuth, navigate])

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
