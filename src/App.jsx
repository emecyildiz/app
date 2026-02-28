import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/newAuthStore'
import { useFavoritesStore } from './store/favoritesStore'
import { userService } from './services/userService'
import { activityService } from './services/activityService'

// Layout components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ModeratorRoute from './components/ModeratorRoute'
import LoadingSpinner from './components/LoadingSpinner'
import ScrollToTop from './components/ScrollToTop'

// Lazy load pages
const Home = lazy(() => import('./pages/Home'))
const Movies = lazy(() => import('./pages/Movies'))
const MovieDetail = lazy(() => import('./pages/MovieDetail'))
const About = lazy(() => import('./pages/About'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
import Profile from './pages/Profile'
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const EmailConfirmed = lazy(() => import('./pages/EmailConfirmed'))
const ConfirmSignup = lazy(() => import('./pages/ConfirmSignup'))
const InviteUserAccepted = lazy(() => import('./pages/InviteUserAccepted'))
const MagicLink = lazy(() => import('./pages/MagicLink'))
const ChangeEmailConfirmed = lazy(() => import('./pages/ChangeEmailConfirmed'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Reauthenticate = lazy(() => import('./pages/Reauthenticate'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminUserEdit = lazy(() => import('./pages/AdminUserEdit'))
const ModeratorDashboard = lazy(() => import('./pages/ModeratorDashboard'))


function App() {
  const { isAuthenticated, user, isLoading, isInitialized, isInitializing } = useAuthStore()
  const { syncFromDB } = useFavoritesStore()

  // Setup auth state listener with proper cleanup (runs once on mount)
  useEffect(() => {
    console.log('Setting up auth listener...')
    const subscription = useAuthStore.getState().setupAuthListener()
    
    // Cleanup function: unsubscribe when component unmounts
    return () => {
      console.log('Cleaning up auth listener...')
      if (subscription?.unsubscribe) {
        subscription.unsubscribe()
      }
    }
  }, []) // Empty dependency array: run once on mount, cleanup on unmount

  // Load favorites from DB when user authenticates
  useEffect(() => {
    const loadFavoritesFromDB = async () => {
      if (isAuthenticated && !isLoading) {
        try {
          const favoriteIds = await userService.getFavoritesList();
          syncFromDB(favoriteIds);
        } catch (error) {
          console.error('Failed to load favorites from DB:', error);
        }
      }
    };
    
    loadFavoritesFromDB();
  }, [isAuthenticated, isLoading, syncFromDB])

  // Start activity tracking when user is authenticated
  useEffect(() => {
    let activityInterval = null
    
    if (isAuthenticated) {
      // Start activity tracking (can be disabled by env)
      activityInterval = activityService.startTracking()
    }

    // Cleanup on unmount or when auth changes
    return () => {
      if (activityInterval) {
        activityService.stopTracking(activityInterval)
      }
    }
  }, [isAuthenticated])

  // Show loading spinner only while auth is bootstrapping
  if (!isInitialized && (isLoading || isInitializing) && !isAuthenticated) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <Router>
      <ScrollToTop />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e1e1e',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
      
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Home />
            </Suspense>
          } />
          
          <Route path="movies" element={
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Movies />
            </Suspense>
          } />
          
          <Route path="movies/:id" element={
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <MovieDetail />
            </Suspense>
          } />

          <Route path="about" element={
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <About />
            </Suspense>
          } />
          
          <Route path="terms" element={
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Terms />
            </Suspense>
          } />
          
          <Route path="privacy" element={
            <Suspense fallback={<LoadingSpinner fullScreen />}>
              <Privacy />
            </Suspense>
          } />
          
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Navigate to="/profile/overview" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile/:section"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <AdminDashboard />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="admin/user/:userId"
            element={
              <AdminRoute>
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <AdminUserEdit />
                </Suspense>
              </AdminRoute>
            }
          />
          <Route
            path="moderator"
            element={
              <ModeratorRoute>
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <ModeratorDashboard />
                </Suspense>
              </ModeratorRoute>
            }
          />

          <Route
            path="u/:username"
            element={
              <Suspense fallback={<LoadingSpinner fullScreen />}>
                <PublicProfile />
              </Suspense>
            }
          />

        </Route>
        
        <Route path="/login" element={
          (isAuthenticated && user) ? <Navigate to="/" /> : 
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          (isAuthenticated && user) ? <Navigate to="/" /> : 
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Register />
          </Suspense>
        } />
        
        {/* OAuth Callback */}
        <Route path="/auth/callback" element={
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <AuthCallback />
          </Suspense>
        } />
        
        <Route path="/email-confirmed" element={
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <EmailConfirmed />
          </Suspense>
        } />
        <Route path="/confirm-signup" element={<Suspense fallback={<LoadingSpinner fullScreen />}><ConfirmSignup /></Suspense>} />
        <Route path="/invite-accepted" element={<Suspense fallback={<LoadingSpinner fullScreen />}><InviteUserAccepted /></Suspense>} />
        <Route path="/magic-link" element={<Suspense fallback={<LoadingSpinner fullScreen />}><MagicLink /></Suspense>} />
        <Route path="/change-email" element={<Suspense fallback={<LoadingSpinner fullScreen />}><ChangeEmailConfirmed /></Suspense>} />
        <Route path="/reset-password" element={<Suspense fallback={<LoadingSpinner fullScreen />}><ResetPassword /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<LoadingSpinner fullScreen />}><ForgotPassword /></Suspense>} />
        <Route path="/reauthenticate" element={<Suspense fallback={<LoadingSpinner fullScreen />}><Reauthenticate /></Suspense>} />
      </Routes>
    </Router>
  )
}

export default App