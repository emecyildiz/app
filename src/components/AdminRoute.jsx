import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/newAuthStore'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, profile } = useAuthStore()

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!profile || profile.role !== 'ADMIN') return <Navigate to="/" replace />

  return children
}

export default AdminRoute


