import { ArrowRight, Building2, Menu, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getDashboardPath } from '../../lib/routes.js'
import { ThemeSwitcher } from '../ThemeSwitcher.jsx'
import { ProfileMenu } from './ProfileMenu.jsx'

const landingLinks = [
  { id: 'home', label: 'Home' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'workflows', label: 'Role flows' },
  { id: 'governance', label: 'Governance' },
  { id: 'start', label: 'Start' },
]

function getSectionHref(id) {
  return id === 'home' ? '/' : `/#${id}`
}

function PublicLinkGroup({ onSelect }) {
  return (
    <>
      {landingLinks.map((link) => (
        <a
          key={link.id}
          href={getSectionHref(link.id)}
          onClick={onSelect}
          className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
        >
          {link.label}
        </a>
      ))}
    </>
  )
}

function GuestActions({ onSelect, stacked = false }) {
  return (
    <div className={`flex ${stacked ? 'flex-col' : 'items-center'} gap-3`}>
      <NavLink
        to="/login"
        onClick={onSelect}
        className={({ isActive }) =>
          `inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            isActive
              ? 'bg-[var(--surface-strong)] text-[var(--text)] shadow-sm'
              : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
          }`
        }
      >
        Sign in
      </NavLink>
      <NavLink
        to="/register"
        onClick={onSelect}
        className={({ isActive }) =>
          `btn-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${isActive ? 'brightness-105' : ''}`
        }
      >
        Create account
        <ArrowRight className="h-4 w-4" />
      </NavLink>
    </div>
  )
}

function SignedInActions({ user, onSelect, stacked = false }) {
  const dashboardPath = getDashboardPath(user.role)

  return (
    <div className={`flex ${stacked ? 'flex-col' : 'items-center'} gap-3`}>
      <NavLink
        to={dashboardPath}
        onClick={onSelect}
        className={({ isActive }) =>
          `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
            isActive
              ? 'bg-[var(--surface-strong)] text-[var(--text)] shadow-sm'
              : 'btn-primary'
          }`
        }
      >
        Dashboard
        <ArrowRight className="h-4 w-4" />
      </NavLink>
      <ProfileMenu user={user} compact />
    </div>
  )
}

export function PublicNavbar() {
  const { user } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.hash])

  return (
    <header className="sticky top-4 z-40">
      <div className="panel mx-auto flex max-w-[1440px] items-center justify-between rounded-[28px] px-4 py-3 sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold">Smart Campus</p>
              <p className="truncate text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Operations Hub
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            <PublicLinkGroup />
          </nav>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeSwitcher />
          {user ? <SignedInActions user={user} /> : <GuestActions />}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] lg:hidden"
          aria-label={menuOpen ? 'Close site navigation' : 'Open site navigation'}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="panel mx-auto mt-3 max-w-[1440px] rounded-[28px] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-[22px] bg-[var(--surface-muted)] px-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Coordinated campus operations</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Sign in for role-aware dashboards, bookings, ticketing, and alerts.
                </p>
              </div>
            </div>

            <nav className="grid gap-1">
              <PublicLinkGroup onSelect={() => setMenuOpen(false)} />
            </nav>

            <div className="border-t border-[var(--border)] pt-4">
              <ThemeSwitcher />
            </div>

            {user ? (
              <SignedInActions user={user} onSelect={() => setMenuOpen(false)} stacked />
            ) : (
              <GuestActions onSelect={() => setMenuOpen(false)} stacked />
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
