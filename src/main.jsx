import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { useAuthStore } from './store/newAuthStore'

// Initialize auth and setup listener
const authStore = useAuthStore.getState()
authStore.initializeAuth()
authStore.setupAuthListener()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)