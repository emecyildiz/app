import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { authService } from '../services/authService'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Verifying your email address…')

  useEffect(() => {
    const token = searchParams.get('token') || ''
    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing its token.')
      return
    }
    authService.verifyEmail(token)
      .then(() => { setStatus('success'); setMessage('Your email address has been verified. You can now sign in.') })
      .catch((error) => { setStatus('error'); setMessage(error.message) })
  }, [searchParams])

  return <div className="min-h-screen flex items-center justify-center px-4"><div className="w-full max-w-md glass rounded-2xl p-8 text-center">
    {status === 'loading' && <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />}
    {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />}
    {status === 'error' && <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />}
    <h1 className="text-2xl font-bold text-white mb-3">{status === 'success' ? 'Email verified' : status === 'error' ? 'Verification failed' : 'Verifying email'}</h1>
    <p className="text-gray-400">{message}</p>
    {status !== 'loading' && <Link to="/login" className="btn btn-primary inline-flex mt-7">Go to sign in</Link>}
  </div></div>
}

export default VerifyEmail
