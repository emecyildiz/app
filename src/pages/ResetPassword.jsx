import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CheckCircle, XCircle } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { authService } from '../services/authService'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const password = watch('password')
  const [status, setStatus] = useState(token ? 'form' : 'error')
  const [error, setError] = useState('')

  const onSubmit = async ({ password: nextPassword }) => {
    setError('')
    try {
      await authService.resetPassword(token, nextPassword)
      setStatus('success')
      window.setTimeout(() => navigate('/login', {
        replace: true,
        state: { message: 'Password updated. Sign in with your new password.' },
      }), 1200)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={status === 'form' ? 'Choose a new password.' : status === 'success' ? 'Password updated.' : 'Invalid reset link.'}
      description={status === 'form'
        ? 'Use 10–72 characters with at least one letter and one number.'
        : status === 'success'
          ? 'Your account is ready. We are returning you to sign in.'
          : 'This password reset link is missing, invalid, or has expired.'}
      footer={<Link to="/login" className="font-semibold text-[#e85d4a] transition hover:text-[#f47b65]">Back to sign in</Link>}
    >
      {status === 'error' && (
        <div className="text-center">
          <XCircle className="mx-auto h-14 w-14 text-[#e85d4a]" strokeWidth={1.4} aria-hidden="true" />
          <Link to="/forgot-password" className="ui-button-primary mt-7 w-full">Request a new link</Link>
        </div>
      )}

      {status === 'form' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div>
            <label htmlFor="new-password" className="ui-field-label">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password', {
                required: 'Password is required.',
                minLength: { value: 10, message: 'Password must contain at least 10 characters.' },
                maxLength: { value: 72, message: 'Password must not exceed 72 characters.' },
                pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'Include at least one letter and one number.' },
              })}
              className="input w-full"
            />
            {errors.password && <p className="ui-form-error">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirm-password" className="ui-field-label">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register('confirmPassword', {
                required: 'Confirm your password.',
                validate: (value) => value === password || 'Passwords do not match.',
              })}
              className="input w-full"
            />
            {errors.confirmPassword && <p className="ui-form-error">{errors.confirmPassword.message}</p>}
          </div>

          {error && <div className="ui-alert-danger">{error}</div>}

          <button type="submit" disabled={isSubmitting} className="ui-button-primary w-full">
            {isSubmitting ? 'Updating password…' : 'Update password'}
          </button>
        </form>
      )}

      {status === 'success' && (
        <div className="text-center" role="status">
          <CheckCircle className="mx-auto h-14 w-14 text-emerald-400" strokeWidth={1.4} aria-hidden="true" />
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-white/45">Redirecting to sign in…</p>
        </div>
      )}
    </AuthShell>
  )
}

export default ResetPassword
