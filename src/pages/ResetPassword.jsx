import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../config/supabase'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register, handleSubmit } = useForm()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'recovery') {
      setStatus('form')
    } else {
      setStatus('error')
    }
  }, [searchParams])

  const onSubmit = async (data) => {
    try {
      setError('')
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      setStatus('success')
      setTimeout(() => navigate('/login'), 1500)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md glass rounded-2xl p-8">
        {status === 'loading' && <p className="text-gray-400 text-center">Yükleniyor...</p>}
        {status === 'error' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <p className="text-gray-400">Bağlantı geçersiz.</p>
          </div>
        )}
        {status === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h1 className="text-2xl font-bold text-white mb-2 text-center">Şifre Sıfırla</h1>
            <input type="password" placeholder="Yeni şifre" {...register('password', { required: true, minLength: 6 })} className="input w-full" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="btn btn-primary w-full">Kaydet</button>
          </form>
        )}
        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <p className="text-gray-400">Şifre güncellendi. Girişe yönlendiriliyorsunuz...</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ResetPassword


