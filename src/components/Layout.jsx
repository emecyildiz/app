import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'
import { SocialNotificationsProvider } from '../context/SocialNotificationsContext'
const Layout = () => {
  return (
    <SocialNotificationsProvider>
      <div className="flex min-h-screen flex-col bg-[#0d0e0c]">
        <Navbar />
        <main className="flex-1 pb-16 pt-[72px] sm:pb-0">
          <Outlet />
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    </SocialNotificationsProvider>
  )
}

export default Layout
