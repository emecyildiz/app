import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { useAuthStore } from './store/newAuthStore'

// Single-source auth bootstrap: do it once here, guarded against StrictMode double-invoke
const authStore = useAuthStore.getState()
;(async () => {
  try {
    if (!authStore.isInitialized && !authStore.isInitializing) {
      await authStore.initializeAuth()
      // Note: setupAuthListener is now called in App.jsx useEffect for proper cleanup
    } else {
      console.log('Bootstrap: auth already initializing/initialized, skipping...')
    }
  } catch (e) {
    console.error('Bootstrap auth error:', e)
  }
})()

// Setup dynamic viewport unit to handle mobile browser UI chrome
const setViewportUnit = () => {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}
setViewportUnit()
window.addEventListener('resize', setViewportUnit)
window.addEventListener('orientationchange', setViewportUnit)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)