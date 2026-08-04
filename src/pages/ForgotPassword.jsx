import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Reset your password</h1>
        <p className="text-gray-400 text-center mb-8">Enter your email address and we will send a reset link if an active account exists.</p>
        {sent && <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 text-green-400 text-sm text-center">Check your inbox for the next step.</div>}
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400 text-sm text-center">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type="email" autoComplete="email" {...register('email', { required: 'Email address is required.', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email address.' } })} className="input pl-10" placeholder="you@example.com" disabled={isSending} />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={isSending} className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50">{isSending ? 'Sending…' : 'Send reset link'}</button>
        </form>
        <p className="text-center mt-6"><Link to="/login" className="text-primary-400 hover:text-primary-300">Back to sign in</Link></p>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
