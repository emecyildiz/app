import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/newAuthStore'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()

  // While auth state is resolving, don't redirect or render target yet
  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute