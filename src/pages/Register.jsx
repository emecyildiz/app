import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Lock, Mail, User, UserPlus } from 'lucide-react'
import { useAuthStore } from '../store/newAuthStore'
import { APP_NAME } from '../config/appConfig'

const Register = () => {
  const navigate = useNavigate()
  const { signUp, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    const result = await signUp(data.email, data.password, { name: data.name, username: data.username })
    if (result.success) {
      navigate('/login', {
        replace: true,
        state: { message: result.emailVerificationRequired ? 'Check your email to verify your account before signing in.' : 'Your account is ready. Sign in to continue.' },
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center mb-8"><img src="/brand/ratemet-logo.svg" alt={APP_NAME} className="h-10 w-auto" /></Link>
        <div className="glass rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white text-center mb-2">Create your account</h1>
          <p className="text-gray-400 text-center mb-8">Build your watchlist and share what you think.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Field label="Name" error={errors.name?.message} icon={<User className="w-5 h-5" />}>
              <input autoComplete="name" {...register('name', { required: 'Name is required.', minLength: { value: 2, message: 'Name must contain at least 2 characters.' }, maxLength: { value: 120, message: 'Name must not exceed 120 characters.' } })} className="input pl-10" placeholder="Your name" />
            </Field>
            <Field label="Username" error={errors.username?.message} icon={<User className="w-5 h-5" />}>
              <input autoComplete="username" {...register('username', { required: 'Username is required.', pattern: { value: /^[a-z0-9_]{3,32}$/, message: 'Use 3-32 lowercase letters, numbers, or underscores.' }, setValueAs: (value) => value?.trim().toLowerCase() })} className="input pl-10" placeholder="movie_fan" />
            </Field>
            <Field label="Email address" error={errors.email?.message} icon={<Mail className="w-5 h-5" />}>
              <input type="email" autoComplete="email" {...register('email', { required: 'Email address is required.', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email address.' } })} className="input pl-10" placeholder="you@example.com" />
            </Field>
            <Field label="Password" error={errors.password?.message} icon={<Lock className="w-5 h-5" />}>
              <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...register('password', { required: 'Password is required.', minLength: { value: 10, message: 'Password must contain at least 10 characters.' }, maxLength: { value: 72, message: 'Password must not exceed 72 characters.' }, pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'Password must contain at least one letter and one number.' } })} className="input pl-10 pr-20" placeholder="10+ characters" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white">{showPassword ? 'Hide' : 'Show'}</button>
            </Field>
            <Field label="Confirm password" error={errors.confirmPassword?.message} icon={<Lock className="w-5 h-5" />}>
              <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...register('confirmPassword', { required: 'Confirm your password.', validate: (value) => value === password || 'Passwords do not match.' })} className="input pl-10" placeholder="Repeat your password" />
            </Field>

            <label className="flex items-start text-sm text-gray-300">
              <input type="checkbox" {...register('terms', { required: 'You must accept the terms and privacy policy.' })} className="w-4 h-4 mt-1 rounded border-gray-600 bg-dark-200 text-primary-500" />
              <span className="ml-2">I accept the <Link to="/terms" className="text-primary-400">Terms of Service</Link> and <Link to="/privacy" className="text-primary-400">Privacy Policy</Link>.</span>
            </label>
            {errors.terms && <p className="text-sm text-red-400">{errors.terms.message}</p>}

            <button type="submit" disabled={isLoading} className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50">
              {isLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus className="w-5 h-5" />Create account</>}
            </button>
          </form>
          <p className="text-center text-gray-400 mt-8">Already have an account? <Link to="/login" className="text-primary-400 font-medium">Sign in</Link></p>
        </div>
      </motion.div>
    </div>
  )
}

const Field = ({ label, error, icon, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>
      {children}
    </div>
    {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
  </div>
)

export default Register
