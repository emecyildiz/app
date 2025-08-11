import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import LoadingSpinner from './LoadingSpinner'
import { useAuthStore } from '../store/newAuthStore'

const Layout = () => {
  const { isLoading } = useAuthStore()
  return (
    <div className="min-h-screen flex flex-col">
      {isLoading ? (
        <div className="pt-16">
          <LoadingSpinner />
        </div>
      ) : (
        <Navbar />
      )}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout