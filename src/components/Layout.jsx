import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'
// Keep navbar always visible; page-level components handle loading

const Layout = () => {
  const location = useLocation()
  const isProfile = location.pathname === '/profile'
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 pt-16 pb-16 sm:pb-0`}>
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}

export default Layout