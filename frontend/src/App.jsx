import { useState, useEffect } from 'react'
import axios from 'axios'
import FinTrackPro from './FinTrackPro'
import AuthPage from './AuthPage'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
axios.defaults.baseURL = API_URL;

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we have a token and try to get the user
    const token = localStorage.getItem('token')
    if (token) {
      axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setUser(res.data.data.user)
      }).catch(() => {
        localStorage.removeItem('token')
      }).finally(() => {
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (loading) return null; // or a spinner

  if (!user) {
    return <AuthPage onLogin={(u) => setUser(u)} />
  }

  return (
    <FinTrackPro user={user} onLogout={handleLogout} />
  )
}

export default App
