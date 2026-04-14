import { Bell } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext.jsx'

export function NotificationBell() {
  const { unreadCount } = useNotifications()
  const badge = unreadCount > 99 ? '99+' : unreadCount

  return (
    <NavLink
      to="/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      className={({ isActive }) =>
        `relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
          isActive
            ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
            : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text)]'
        }`
      }
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </NavLink>
  )
}
