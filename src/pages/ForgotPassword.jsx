import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { authService } from '../services/authService'

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async ({ email }) => {
    setIsSending(true)
    setError('')
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password."
      description="Enter your email address. If an active account exists, we will send a time-limited reset link."
      footer={<Link to="/login" className="font-semibold text-[#e85d4a] transition hover:text-[#f47b65]">Back to sign in</Link>}
    >
      {sent && <div className="ui-alert-success mb-6">Check your inbox for the next step.</div>}
      {error && <div className="ui-alert-danger mb-6">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div>
          <label htmlFor="recovery-email" className="ui-field-label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77756f]" strokeWidth={1.6} />
            <input id="recovery-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...register('email', { required: 'Email address is required.', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email address.' } })} className="input pl-11" placeholder="you@example.com" disabled={isSending} />
          </div>
          {errors.email && <p className="ui-form-error">{errors.email.message}</p>}
        </div>
        <button type="submit" disabled={isSending || sent} className="ui-button-primary w-full">
          {isSending ? 'Sending...' : sent ? 'Reset link sent' : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  )
}

export default ForgotPassword
