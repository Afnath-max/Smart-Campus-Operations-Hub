import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
} from 'react'
import { api, toApiError } from '../lib/api.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)

  const refreshSession = async () => {
    try {
      const response = await api.get('/api/users/me')
      startTransition(() => {
        setUser(response.data)
        setStatus('authenticated')
      })
      return response.data
    } catch (error) {
      startTransition(() => {
        setUser(null)
        setStatus('unauthenticated')
      })
      return null
    }
  }

  useEffect(() => {
    refreshSession()
  }, [])

  const login = async (payload) => {
    const response = await api.post('/api/auth/login', payload)
    startTransition(() => {
      setUser(response.data.user)
      setStatus('authenticated')
    })
    return response.data
  }

  const register = async (payload) => {
    const response = await api.post('/api/auth/register', payload)
    startTransition(() => {
      setUser(response.data.user)
      setStatus('authenticated')
    })
    return response.data
  }

  const logout = async () => {
    await api.post('/api/auth/logout')
    startTransition(() => {
      setUser(null)
      setStatus('unauthenticated')
    })
  }

  const beginGoogleLink = async () => {
    try {
      const response = await api.post('/api/auth/link-google')
      return response.data
    } catch (error) {
      throw toApiError(error, 'Unable to start the Google linking flow')
    }
  }

  const value = {
    status,
    user,
    isAuthenticated: status === 'authenticated',
    refreshSession,
    login,
    register,
    logout,
    beginGoogleLink,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
