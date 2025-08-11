import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/newAuthStore'

const OperatorRoute = ({ children }) => {
  const { isAuthenticated, isLoading, profile } = useAuthStore()

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (profile?.role !== 'OPERATOR' && profile?.role !== 'ADMIN') return <Navigate to="/" replace />

  return children
}

export default OperatorRoute


