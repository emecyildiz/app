import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
// Keep navbar always visible; page-level components handle loading

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout