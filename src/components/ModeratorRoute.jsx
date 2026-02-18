import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/newAuthStore'

const ModeratorRoute = ({ children }) => {
  const { isAuthenticated, isLoading, profile } = useAuthStore()

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (profile?.role !== 'MODERATOR' && profile?.role !== 'ADMIN') return <Navigate to="/" replace />

  return children
}

export default ModeratorRoute


