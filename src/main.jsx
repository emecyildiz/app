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
      authStore.setupAuthListener()
    } else {
      console.log('Bootstrap: auth already initializing/initialized, skipping...')
    }
  } catch (e) {
    console.error('Bootstrap auth error:', e)
  }
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)