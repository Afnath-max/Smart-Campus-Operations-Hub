import {
  ChevronRight,
  ShieldCheck,
  UserCircle2,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getDashboardPath } from '../../lib/routes.js'
import { ProtectedTopBar } from '../navigation/ProtectedTopBar.jsx'

const roleMeta = {
  USER: {
    title: 'Campus User Console',
    icon: UserCircle2,
    accent: 'Monitor resources, plan bookings, and track campus requests.',
    links: [
      { to: '/dashboard', label: 'Overview' },
      { to: '/catalogue', label: 'Resource catalogue' },
      { to: '/bookings/new', label: 'New booking' },
      { to: '/bookings/my', label: 'My bookings' },
      { to: '/tickets/new', label: 'New ticket' },
      { to: '/tickets/my', label: 'My tickets' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/settings/notifications', label: 'Alert settings' },
      { to: '/profile', label: 'Profile' },
    ],
  },
  TECHNICIAN: {
    title: 'Technician Console',
    icon: Wrench,
    accent: 'Own response queues, service status, and active campus incidents.',
    links: [
      { to: '/technician/dashboard', label: 'Assigned Work' },
      { to: '/technician/tickets', label: 'Ticket queue' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/settings/notifications', label: 'Alert settings' },
      { to: '/profile', label: 'Profile' },
    ],
  },
  ADMIN: {
    title: 'Admin Control Room',
    icon: ShieldCheck,
    accent: 'Coordinate operations, approvals, staffing, and system-wide visibility.',
    links: [
      { to: '/admin/dashboard', label: 'Operations' },
      { to: '/admin/resources', label: 'Resources' },
      { to: '/admin/bookings', label: 'Bookings' },
      { to: '/admin/tickets', label: 'Tickets' },
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/invitations', label: 'Invitations' },
      { to: '/admin/analytics', label: 'Analytics' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/settings/notifications', label: 'Alert settings' },
      { to: '/profile', label: 'Profile' },
    ],
  },
}

function SidebarContent({ onNavigate }) {
  const { user } = useAuth()
  const config = roleMeta[user.role]
  const RoleIcon = config.icon

  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <RoleIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Smart Campus</p>
            <p className="text-sm text-[var(--text-muted)]">{config.title}</p>
          </div>
        </div>
        <p className="text-sm leading-6 text-[var(--text-muted)]">{config.accent}</p>
      </div>

      <nav className="flex flex-col gap-2 pr-1 lg:pr-0">
        {config.links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-[var(--surface-strong)] text-[var(--text)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
              }`
            }
          >
            <span>{link.label}</span>
            <ChevronRight className="h-4 w-4" />
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function AppShell() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const dashboardPath = getDashboardPath(user.role)

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1440px] gap-4 lg:gap-6">
        <aside className="panel hidden w-[320px] self-start rounded-[32px] p-6 lg:sticky lg:top-4 lg:block">
          <SidebarContent />
        </aside>

        {menuOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden" onClick={() => setMenuOpen(false)}>
            <aside
              className="panel h-full w-[86%] max-w-[320px] overflow-y-auto rounded-none rounded-r-[32px] p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          <div className="panel flex min-h-[calc(100vh-2rem)] flex-col rounded-[32px]">
            <ProtectedTopBar
              user={user}
              dashboardPath={dashboardPath}
              onOpenMenu={() => setMenuOpen(true)}
            />

            <div className="flex-1 overflow-x-hidden px-5 py-5 sm:px-7 sm:py-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
