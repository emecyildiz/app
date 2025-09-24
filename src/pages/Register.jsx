import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Film, Mail, Lock, User, UserPlus } from 'lucide-react'
import { useAuthStore } from '../store/newAuthStore'
import { APP_NAME, APP_LOGO_URL } from '../config/appConfig'

const Register = () => {
  const navigate = useNavigate()
  const { signUp, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    const result = await signUp(data.email, data.password, {
      name: data.name,
      username: data.username
    })
    if (result.success) {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={APP_LOGO_URL} alt={APP_NAME} className="h-10 w-auto" />
        </Link>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Hesap Oluştur
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Film dünyasına katılın
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ad Soyad
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  {...register('name', {
                    required: 'Ad soyad gereklidir',
                    minLength: {
                      value: 3,
                      message: 'Ad soyad en az 3 karakter olmalıdır',
                    },
                  })}
                  className="input pl-10"
                  placeholder="Ad Soyad"
                  autoComplete="off"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  {...register('username', {
                    required: 'Kullanıcı adı gereklidir',
                    pattern: {
                      value: /^[a-z0-9_]+$/,
                      message: 'Kullanıcı adı sadece küçük harf, rakam ve _ içerebilir',
                    },
                    minLength: {
                      value: 3,
                      message: 'Kullanıcı adı en az 3 karakter olmalıdır',
                    },
                    setValueAs: (v) => (v ? v.toLowerCase() : v),
                  })}
                  className="input pl-10"
                  placeholder="Kullanıcı adı"
                  autoComplete="off"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  {...register('email', {
                    required: 'E-posta gereklidir',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Geçerli bir e-posta adresi girin',
                    },
                  })}
                  className="input pl-10"
                  placeholder="E-posta adresiniz"
                  autoComplete="off"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Şifre gereklidir',
                    minLength: {
                      value: 6,
                      message: 'Şifre en az 6 karakter olmalıdır',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir',
                    },
                  })}
                  className="input pl-10 pr-10"
                  placeholder="Şifrenizi girin"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Şifre Tekrar
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Şifre tekrarı gereklidir',
                    validate: (value) =>
                      value === password || 'Şifreler eşleşmiyor',
                  })}
                  className="input pl-10"
                  placeholder="Şifrenizi tekrar girin"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  {...register('terms', {
                    required: 'Kullanım koşullarını kabul etmelisiniz',
                  })}
                  className="w-4 h-4 mt-1 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                />
                <span className="ml-2 text-sm text-gray-300">
                  <Link to="/terms" className="text-primary-400 hover:text-primary-300">
                    Kullanım koşullarını
                  </Link>{' '}
                  ve{' '}
                  <Link to="/privacy" className="text-primary-400 hover:text-primary-300">
                    gizlilik politikasını
                  </Link>{' '}
                  kabul ediyorum
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-400">{errors.terms.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Kayıt Ol
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-gray-400 mt-8">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Giriş Yapın
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Register