import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle } from 'lucide-react'
import { authService } from '../services/authService'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')
  const [status, setStatus] = useState(token ? 'form' : 'error')
  const [error, setError] = useState('')

  const onSubmit = async ({ password: nextPassword }) => {
    setError('')
    try {
      await authService.resetPassword(token, nextPassword)
      setStatus('success')
      window.setTimeout(() => navigate('/login', { replace: true, state: { message: 'Password updated. Sign in with your new password.' } }), 1200)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass rounded-2xl p-8">
        {status === 'error' && <div className="text-center"><XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" /><h1 className="text-2xl font-bold text-white">Invalid reset link</h1><p className="text-gray-400 mt-3">This password reset link is missing or invalid.</p><Link to="/forgot-password" className="inline-block mt-6 text-primary-400">Request a new link</Link></div>}
        {status === 'form' && <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <h1 className="text-2xl font-bold text-white text-center">Choose a new password</h1>
          <p className="text-gray-400 text-sm text-center">Use 10-72 characters with at least one letter and one number.</p>
          <div><input type="password" autoComplete="new-password" placeholder="New password" {...register('password', { required: 'Password is required.', minLength: { value: 10, message: 'Password must contain at least 10 characters.' }, maxLength: { value: 72, message: 'Password must not exceed 72 characters.' }, pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'Include at least one letter and one number.' } })} className="input w-full" />{errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}</div>
          <div><input type="password" autoComplete="new-password" placeholder="Confirm new password" {...register('confirmPassword', { required: 'Confirm your password.', validate: (value) => value === password || 'Passwords do not match.' })} className="input w-full" />{errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>}</div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="btn btn-primary w-full">Update password</button>
        </form>}
        {status === 'success' && <div className="text-center"><CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" /><h1 className="text-2xl font-bold text-white">Password updated</h1><p className="text-gray-400 mt-3">Redirecting you to sign in…</p></div>}
      </motion.div>
    </div>
  )
}

export default ResetPassword
