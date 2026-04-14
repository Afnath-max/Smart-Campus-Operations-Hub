import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Link2,
  LogOut,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { resolveApiUrl } from '../../lib/api.js'
import { getDashboardPath } from '../../lib/routes.js'
import { canLinkGoogleAccount, getAuthProviderLabel, getRoleLabel, getUserInitials } from '../../features/access/api/user.js'
import { AlertBanner } from '../AlertBanner.jsx'

function MenuLink({ to, icon: Icon, title, onSelect }) {
  return (
    <Link
      to={to}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-[20px] px-3 py-3 text-left transition hover:bg-[color-mix(in_srgb,var(--surface-soft)_76%,transparent)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--surface-soft)_88%,var(--surface)_12%)] text-[var(--text)] shadow-[var(--surface-highlight)]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold text-[var(--text)]">{title}</span>
    </Link>
  )
}

export function ProfileMenu({ user, compact = false }) {
  const { logout, beginGoogleLink } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [linking, setLinking] = useState(false)
  const [actionError, setActionError] = useState('')

  const dashboardPath = getDashboardPath(user.role)
  const initials = getUserInitials(user.fullName)
  const roleLabel = getRoleLabel(user.role)
  const authProviderLabel = getAuthProviderLabel(user.authProviderType)
  const showGoogleLink = canLinkGoogleAccount(user)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  useEffect(() => {
    setOpen(false)
    setActionError('')
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleLinkGoogle = async () => {
    setActionError('')
    setLinking(true)

    try {
      const response = await beginGoogleLink()
      window.location.assign(resolveApiUrl(response.authorizationUrl))
    } catch (error) {
      setActionError(error.message || 'Google linking could not be started.')
      setLinking(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative shrink-0 ${compact ? 'w-auto min-[520px]:w-[12.5rem] xl:w-[15rem]' : 'w-full max-w-[18rem]'}`}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open user menu"
        className="flex w-full items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_97%,transparent),color-mix(in_srgb,var(--surface-soft)_44%,var(--surface)))] px-2.5 py-2 text-left shadow-[var(--surface-highlight)] transition hover:border-[color-mix(in_srgb,var(--primary)_26%,var(--border))]"
      >
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={user.fullName}
            className="h-11 w-11 rounded-2xl object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#60a5fa_0%,#2dd4bf_100%)] font-semibold text-white shadow-[var(--interactive-glow)]">
            {initials}
          </span>
        )}
        <span className={`min-w-0 ${compact ? 'hidden min-[520px]:block' : 'hidden md:block'}`}>
          <span className="block truncate text-sm font-semibold text-[var(--text)]">{user.fullName}</span>
          <span className="block truncate text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            {roleLabel}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--text-muted)] transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="User menu"
          className={`panel absolute right-0 top-[calc(100%+0.75rem)] z-30 max-w-[calc(100vw-2rem)] rounded-[30px] p-3 ${
            compact ? 'w-[15rem] min-[520px]:w-full' : 'w-full'
          }`}
        >
          <div className="grid gap-1">
            <MenuLink
              to={dashboardPath}
              icon={LayoutDashboard}
              title="Dashboard"
              onSelect={() => setOpen(false)}
            />
            <MenuLink
              to="/notifications"
              icon={Bell}
              title="Notifications"
              onSelect={() => setOpen(false)}
            />

            {showGoogleLink ? (
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={linking}
                className="flex items-center gap-3 rounded-[20px] px-3 py-3 text-left transition hover:bg-[color-mix(in_srgb,var(--surface-soft)_76%,transparent)] disabled:opacity-60"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--surface-soft)_88%,var(--surface)_12%)] text-[var(--text)] shadow-[var(--surface-highlight)]">
                  <Link2 className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-[var(--text)]">
                  {linking ? 'Starting Google link...' : 'Link Google'}
                </span>
              </button>
            ) : null}
          </div>

          {actionError ? (
            <AlertBanner className="mt-3" onClose={() => setActionError('')}>
              {actionError}
            </AlertBanner>
          ) : null}

          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <button
              type="button"
              onClick={handleLogout}
              className="logout-surface flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left transition hover:brightness-[1.03]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] text-[var(--logout-text)]">
                <LogOut className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-[var(--logout-text)]">Sign out</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

