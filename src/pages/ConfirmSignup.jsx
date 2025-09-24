import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../config/supabase'

const ConfirmSignup = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
        const type = params.get('type')
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (type === 'signup' && accessToken) {
          try {
            if (refreshToken) {
              await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            }
          } catch {}

          setStatus('success')
          try {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
          } catch {}

          setTimeout(() => navigate('/login', { state: { message: 'E‑posta doğrulandı. Giriş yapabilirsiniz.' } }), 2500)
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }
    run()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md text-center glass rounded-2xl p-8">
        {status === 'loading' && <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-6" />}
        {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />}
        {status === 'error' && <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />}
        <h1 className="text-2xl font-bold text-white mb-2">Kayıt Doğrulaması</h1>
        <p className="text-gray-400">{status === 'loading' ? 'Doğrulama sürüyor...' : status === 'success' ? 'E‑posta doğrulandı!' : 'Bağlantı geçersiz veya süresi dolmuş.'}</p>
      </motion.div>
    </div>
  )
}

export default ConfirmSignup


