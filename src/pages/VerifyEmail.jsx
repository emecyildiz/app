import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MailCheck, MailWarning, Clock, RefreshCcw } from 'lucide-react'
import { useAuthStore } from '../store/newAuthStore'

const VerifyEmail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyEmailOtp, resendEmailOtp, isLoading } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [code, setCode] = useState(Array(6).fill(''))
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    const state = location.state || {}
    if (!state.email || !state.password) {
      navigate('/register')
      return
    }
    setEmail(state.email)
    setPassword(state.password)
    setName(state.name || '')
    setUsername(state.username || '')
  }, [location.state, navigate])

  useEffect(() => {
    let timer
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000)
    }
    return () => clearInterval(timer)
  }, [resendCooldown])

  const onChangeDigit = (idx, val) => {
    if (/^[0-9]?$/.test(val)) {
      const next = [...code]
      next[idx] = val
      setCode(next)
    }
  }

  const submitCode = async (e) => {
    e.preventDefault()
    const token = code.join('')
    if (token.length !== 6) return
    const result = await verifyEmailOtp(email, token, password, { name, username })
    if (result.success) {
      navigate('/')
    }
  }

  const resend = async () => {
    if (resendCooldown > 0) return
    const result = await resendEmailOtp(email)
    if (result.success) setResendCooldown(30)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <MailCheck className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl font-bold text-white">E-posta Doğrulama</h1>
          </div>

          <p className="text-gray-400 mb-6">
            {email} adresine 6 haneli bir doğrulama kodu gönderdik. Lütfen kodu aşağıya girin.
          </p>

          <form onSubmit={submitCode} className="space-y-6">
            <div className="flex justify-between gap-2">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => onChangeDigit(idx, e.target.value)}
                  className="w-12 h-12 text-center text-lg rounded-lg bg-dark-200 border border-gray-700 text-white focus:border-primary-500 focus:outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Doğrulanıyor...' : 'Kodu Doğrula'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Spam klasörünü kontrol etmeyi unutmayın.</span>
            </div>
            <button
              onClick={resend}
              disabled={resendCooldown > 0}
              className="flex items-center gap-2 text-primary-400 hover:text-primary-300 disabled:opacity-50"
            >
              <RefreshCcw className="w-4 h-4" />
              {resendCooldown > 0 ? `${resendCooldown}s` : 'Kodu Yeniden Gönder'}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 text-amber-400 text-sm">
            <MailWarning className="w-4 h-4" />
            <span>E-posta gelmediyse doğru adresi girdiğinizden emin olun.</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default VerifyEmail


