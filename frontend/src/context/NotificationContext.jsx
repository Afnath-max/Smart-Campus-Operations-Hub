import { createContext, startTransition, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from './AuthContext.jsx'

export const NotificationContext = createContext({
  unreadCount: 0,
  refreshUnreadCount: async () => 0,
  setUnreadCount: () => {},
})

export function NotificationProvider({ children }) {
  const { status, user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = async () => {
    if (status !== 'authenticated' || !user) {
      startTransition(() => {
        setUnreadCount(0)
      })
      return 0
    }

    try {
      const response = await api.get('/api/notifications/unread/count')
      const nextCount = response.data.unreadCount || 0
      startTransition(() => {
        setUnreadCount(nextCount)
      })
      return nextCount
    } catch {
      startTransition(() => {
        setUnreadCount(0)
      })
      return 0
    }
  }

  useEffect(() => {
    if (status !== 'authenticated' || !user) {
      setUnreadCount(0)
      return
    }

    refreshUnreadCount()
  }, [status, user])

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
