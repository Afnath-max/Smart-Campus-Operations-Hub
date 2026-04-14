import {
  Bell,
  ChevronRight,
  Link2,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { resolveApiUrl } from '../../../lib/api.js'
import { getDashboardPath } from '../../../lib/routes.js'
import {
  canLinkGoogleAccount,
  getAuthProviderLabel,
  getRoleLabel,
  getUserInitials,
} from '../api/user.js'

function DetailCard({ label, value, tone = 'default' }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p
        className={`mt-3 text-lg font-semibold ${
          tone === 'accent' ? 'text-[var(--primary)]' : 'text-[var(--text)]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function ActionLink({ to, icon: Icon, title, body }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition hover:border-[var(--primary)]"
    >
      <span className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block font-semibold text-[var(--text)]">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-[var(--text-muted)]">{body}</span>
        </span>
      </span>
      <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
    </Link>
  )
}

export function ProfilePage() {
  const { user, logout, beginGoogleLink } = useAuth()
  const navigate = useNavigate()
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')

  const roleLabel = getRoleLabel(user.role)
  const authProviderLabel = getAuthProviderLabel(user.authProviderType)
  const initials = getUserInitials(user.fullName)
  const dashboardPath = getDashboardPath(user.role)
  const showGoogleLink = canLinkGoogleAccount(user)

  const handleLinkGoogle = async () => {
    setLinkError('')
    setLinking(true)

    try {
      const response = await beginGoogleLink()
      window.location.assign(resolveApiUrl(response.authorizationUrl))
    } catch (error) {
      setLinkError(error.message || 'Google linking could not be started.')
      setLinking(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.fullName}
                className="h-20 w-20 rounded-[28px] object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[var(--primary)] text-2xl font-semibold text-white">
                {initials}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Account profile
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{user.fullName}</h1>
              <p className="mt-3 text-base text-[var(--text-muted)]">{user.email}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--primary)]">
                  {roleLabel}
                </span>
                <span className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-sm font-semibold text-[var(--text-muted)]">
                  {authProviderLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm leading-7 text-[var(--text-muted)] lg:max-w-sm">
            Use this page for identity details, connected sign-in methods, notification controls, and a clean sign-out
            flow without crowding the sidebar.
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailCard label="Campus ID" value={user.campusId} />
        <DetailCard label="Role" value={roleLabel} tone="accent" />
        <DetailCard label="Access" value={authProviderLabel} />
        <DetailCard label="Google linked" value={user.googleLinked ? 'Connected' : 'Not connected'} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">Profile actions</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                Keep navigation focused in the sidebar, then manage account-level actions here with clearer spacing and
                stronger hierarchy.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <ActionLink
              to={dashboardPath}
              icon={ShieldCheck}
              title="Back to dashboard"
              body="Return to the workspace matched to your current role."
            />
            <ActionLink
              to="/notifications"
              icon={Bell}
              title="Open notifications"
              body="Review unread activity and workflow updates for this account."
            />
            <ActionLink
              to="/settings/notifications"
              icon={Bell}
              title="Notification preferences"
              body="Adjust which booking and ticket changes create alerts."
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <h2 className="font-display text-2xl font-semibold">Connected sign-in</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
            Your role still comes from the backend account record. Connected identities simply make sign-in easier.
          </p>

          <div className="mt-6 space-y-4">
            {showGoogleLink ? (
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={linking}
                className="flex w-full items-center justify-center gap-3 rounded-[22px] bg-[var(--primary)] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:opacity-60"
              >
                <Link2 className="h-4 w-4" />
                {linking ? 'Starting Google link...' : 'Link Google account'}
              </button>
            ) : (
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm leading-7 text-[var(--text-muted)]">
                Google identity is already connected for this account configuration.
              </div>
            )}

            {linkError ? (
              <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-5 py-4 text-sm text-[var(--danger)]">
                {linkError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-3 rounded-[22px] border border-[color-mix(in_srgb,var(--danger)_18%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_9%,var(--surface))] px-5 py-4 text-sm font-semibold text-[var(--danger)] transition hover:bg-[color-mix(in_srgb,var(--danger)_14%,var(--surface))]"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

