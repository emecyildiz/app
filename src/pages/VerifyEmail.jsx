import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import { authService } from '../services/authService'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Verifying your email address...')

  useEffect(() => {
    const token = searchParams.get('token') || ''
    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing its token.')
      return
    }

    authService.verifyEmail(token)
      .then(() => {
        setStatus('success')
        setMessage('Your email address has been verified. You can now sign in.')
      })
      .catch((error) => {
        setStatus('error')
        setMessage(error.message)
      })
  }, [searchParams])

  const title = status === 'success' ? 'Email verified.' : status === 'error' ? 'Verification failed.' : 'Verifying your email.'

  return (
    <AuthShell eyebrow="Email verification" title={title} description={message}>
      <div className="flex min-h-32 items-center justify-center border border-white/10 bg-white/[0.02]">
        {status === 'loading' && <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#e85d4a]" role="status" aria-label="Verifying email" />}
        {status === 'success' && <CheckCircle className="h-14 w-14 text-emerald-400" strokeWidth={1.4} />}
        {status === 'error' && <XCircle className="h-14 w-14 text-[#e85d4a]" strokeWidth={1.4} />}
      </div>
      {status !== 'loading' && <Link to="/login" className="ui-button-primary mt-6 w-full">Go to sign in</Link>}
    </AuthShell>
  )
}

export default VerifyEmail
