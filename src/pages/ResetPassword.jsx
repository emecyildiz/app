import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../config/supabase'

const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, handleSubmit } = useForm()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    // Ensure Supabase initializes session from URL (hash/query params)
    try { supabase.auth.getSession() } catch {}
  }, [])

  useEffect(() => {
    // Supabase sends recovery info in the URL hash (e.g. #access_token=...&type=recovery)
    // but can also arrive via query. Check both.
    const queryType = new URLSearchParams(location.search).get('type')
    const hash = (location.hash || '').startsWith('#') ? location.hash.slice(1) : (location.hash || '')
    const hashParams = new URLSearchParams(hash)
    const hashType = hashParams.get('type')
    const accessToken = hashParams.get('access_token') || new URLSearchParams(location.search).get('access_token')
    const code = hashParams.get('code') || new URLSearchParams(location.search).get('code') || hashParams.get('token') || new URLSearchParams(location.search).get('token')
    const type = queryType || hashType
    if (type === 'recovery' || accessToken || code) {
      setStatus('form')
    } else {
      setStatus('error')
    }
  }, [location.search, location.hash])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setStatus('form')
      }
    })
    return () => { try { subscription?.unsubscribe() } catch {} }
  }, [])

  useEffect(() => {
    // Fallback: if a session exists on this route, enable form
    const ensure = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) setStatus('form')
      } catch {}
    }
    ensure()
  }, [])

  useEffect(() => {
    // PKCE/magic-link style: exchange code for session when present
    const hash = (location.hash || '').startsWith('#') ? location.hash.slice(1) : (location.hash || '')
    const hashParams = new URLSearchParams(hash)
    const code = hashParams.get('code') || new URLSearchParams(location.search).get('code')
    if (!code) return
    ;(async () => {
      try {
        await supabase.auth.exchangeCodeForSession(code)
        setStatus('form')
      } catch (e) {
        setError(e?.message || 'Oturum kurulamadı')
        setStatus('error')
      }
    })()
  }, [location.search, location.hash])

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


