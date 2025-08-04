import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

// Layout components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load pages
const Home = lazy(() => import('./pages/Home'))
const Movies = lazy(() => import('./pages/Movies'))
const MovieDetail = lazy(() => import('./pages/MovieDetail'))
const About = lazy(() => import('./pages/About'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminUserEdit = lazy(() => import('./pages/AdminUserEdit'))
const OperatorDashboard = lazy(() => import('./pages/OperatorDashboard'))

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router>
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
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <Profile />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/user/:userId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <AdminUserEdit />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="operator"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <OperatorDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>
        
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : 
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" /> : 
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Register />
          </Suspense>
        } />
      </Routes>
    </Router>
  )
}

export default App