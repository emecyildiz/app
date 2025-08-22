import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import { useAuthStore } from '../store/newAuthStore'

const MagicLink = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {} = useAuthStore()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const run = async () => {
      try {
        const type = searchParams.get('type')
        if (type === 'magiclink' || type === 'recovery') {
          // auth already bootstrapped centrally
          setStatus('success')
          setTimeout(() => navigate('/'), 1500)
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }
    run()
  }, [searchParams, initializeAuth, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md text-center glass rounded-2xl p-8">
        {status === 'loading' && <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-6" />}
        {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />}
        {status === 'error' && <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />}
        <h1 className="text-2xl font-bold text-white mb-2">Magic Link</h1>
        <p className="text-gray-400">{status === 'loading' ? 'Bağlantı doğrulanıyor...' : status === 'success' ? 'Giriş başarılı!' : 'Bağlantı geçersiz veya süresi dolmuş.'}</p>
      </motion.div>
    </div>
  )
}

export default MagicLink


