import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, LogIn, Mail } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { useAuthStore } from '../store/newAuthStore'

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
    <AuthShell
      eyebrow="Member access"
      title="Return to your film journal."
      description="Sign in to continue rating films, updating your archive, and exchanging recommendations."
      footer={<>New to Ratemet? <Link to="/register" className="font-semibold text-[#e85d4a] transition hover:text-[#f47b65]">Create an account</Link></>}
    >
      {message && <div className="ui-alert-success mb-6">{message}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div>
          <label htmlFor="login-email" className="ui-field-label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77756f]" strokeWidth={1.6} />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email', {
                required: 'Email address is required.',
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email address.' },
              })}
              className="input pl-11"
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="ui-form-error">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="login-password" className="ui-field-label mb-0">Password</label>
            <Link to="/forgot-password" className="text-sm text-[#aaa79f] transition hover:text-[#e85d4a]">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77756f]" strokeWidth={1.6} />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password', { required: 'Password is required.' })}
              className="input pl-11 pr-20"
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#77756f] transition hover:text-[#f3efe6]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="ui-form-error">{errors.password.message}</p>}
        </div>

        <button type="submit" disabled={isLoading} className="ui-button-primary w-full">
          {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#17130f]/30 border-t-[#17130f]" /> : <><LogIn className="h-4 w-4" /> Sign in</>}
        </button>
      </form>
    </AuthShell>
  )
}

export default Login
