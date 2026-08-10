import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, Mail, User, UserPlus } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { useAuthStore } from '../store/newAuthStore'

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
    <AuthShell
      eyebrow="Create an archive"
      title="Start your viewing record."
      description="Create a private account for ratings, watch history, favorites, and recommendations."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-[#e85d4a] transition hover:text-[#f47b65]">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="register-name" label="Display name" error={errors.name?.message} icon={User} hint="The name or alias shown on your profile.">
            <input id="register-name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register('name', { required: 'Display name is required.', minLength: { value: 2, message: 'Display name must contain at least 2 characters.' }, maxLength: { value: 120, message: 'Display name must not exceed 120 characters.' } })} className="input pl-11" placeholder="Name shown on your profile" />
          </Field>
          <Field id="register-username" label="Public username" error={errors.username?.message} icon={User} hint="Your unique public handle; this is not a surname.">
            <input id="register-username" autoComplete="username" aria-invalid={Boolean(errors.username)} {...register('username', { required: 'Username is required.', pattern: { value: /^[a-z0-9_]{3,32}$/, message: 'Use 3-32 lowercase letters, numbers, or underscores.' }, setValueAs: (value) => value?.trim().toLowerCase() })} className="input pl-11" placeholder="your_username" />
          </Field>
        </div>

        <Field id="register-email" label="Email address" error={errors.email?.message} icon={Mail}>
          <input id="register-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email', { required: 'Email address is required.', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email address.' } })} className="input pl-11" placeholder="you@example.com" />
        </Field>

        <Field id="register-password" label="Password" error={errors.password?.message} icon={Lock}>
          <input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password', { required: 'Password is required.', minLength: { value: 10, message: 'Password must contain at least 10 characters.' }, maxLength: { value: 72, message: 'Password must not exceed 72 characters.' }, pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'Password must contain at least one letter and one number.' } })} className="input pl-11 pr-20" placeholder="10-72 characters" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#77756f] transition hover:text-[#f3efe6]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
        </Field>

        <Field id="register-confirm" label="Confirm password" error={errors.confirmPassword?.message} icon={Lock}>
          <input id="register-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} {...register('confirmPassword', { required: 'Confirm your password.', validate: (value) => value === password || 'Passwords do not match.' })} className="input pl-11" placeholder="Repeat your password" />
        </Field>

        <label className="flex items-start gap-3 border border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-[#aaa79f]">
          <input type="checkbox" {...register('terms', { required: 'You must accept the terms and privacy notice.' })} className="mt-1 h-4 w-4 shrink-0 accent-[#e85d4a]" />
          <span>I accept the <Link to="/terms" className="text-[#e85d4a]">Terms of Use</Link> and <Link to="/privacy" className="text-[#e85d4a]">Privacy Notice</Link>.</span>
        </label>
        {errors.terms && <p className="ui-form-error">{errors.terms.message}</p>}

        <button type="submit" disabled={isLoading} className="ui-button-primary w-full">
          {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#17130f]/30 border-t-[#17130f]" /> : <><UserPlus className="h-4 w-4" /> Create account</>}
        </button>
      </form>
    </AuthShell>
  )
}

const Field = ({ id, label, error, hint, icon: Icon, children }) => (
  <div>
    <label htmlFor={id} className="ui-field-label">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77756f]" strokeWidth={1.6} />
      {children}
    </div>
    {error ? <p className="ui-form-error">{error}</p> : hint && <p className="mt-2 text-xs leading-5 text-[#77756f]">{hint}</p>}
  </div>
)

export default Register
