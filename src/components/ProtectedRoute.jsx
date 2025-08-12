import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/newAuthStore'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, session, initializeAuth } = useAuthStore()
  // Ensure auth ready on protected mounts
  useEffect(() => { try { initializeAuth() } catch {} }, [initializeAuth])

  // Wait until auth hydrated
  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute