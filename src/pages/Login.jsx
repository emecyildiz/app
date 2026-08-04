import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Lock, LogIn, Mail } from 'lucide-react'
import { useAuthStore } from '../store/newAuthStore'
import { APP_NAME } from '../config/appConfig'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    setMessage(location.state?.message || '')
  }, [location.state])

  const onSubmit = async ({ email, password }) => {
    const result = await signIn(email, password)
    if (result.success) navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center mb-8">
          <img src="/brand/ratemet-logo.svg" alt={APP_NAME} className="h-10 w-auto" />
        </Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white text-center mb-2">Welcome back</h1>
          <p className="text-gray-400 text-center mb-8">Sign in to your RateMet account.</p>

          {message && <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 text-green-400 text-sm text-center">{message}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email address is required.',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email address.' },
                  })}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password', { required: 'Password is required.' })}
                  className="input pl-10 pr-20"
                  placeholder="Your password"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn className="w-5 h-5" />Sign in</>}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-8">
            New to RateMet? <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Create an account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
