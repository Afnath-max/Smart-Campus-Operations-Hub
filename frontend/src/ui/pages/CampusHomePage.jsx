import { ArrowRight, BellRing, Building2, LayoutDashboard, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { APP_HOME_PATH, getDashboardPath } from '../../lib/routes.js'

const rolePanels = {
  USER: {
    eyebrow: 'Campus home',
    title: 'Start from one place, then move into bookings, tickets, and updates.',
    description:
      'Use this shared home page to orient yourself, then jump back into your dashboard, resource search, or request history.',
    quickLinks: [
      { to: '/catalogue', label: 'Browse resources' },
      { to: '/bookings/my', label: 'My bookings' },
      { to: '/tickets/my', label: 'My tickets' },
    ],
  },
  TECHNICIAN: {
    eyebrow: 'Campus home',
    title: 'Keep a single home point before moving into queue work and service response.',
    description:
      'This gives technicians a clean way to return home, then reopen assigned work, notifications, and service settings.',
    quickLinks: [
      { to: '/technician/tickets', label: 'Assigned queue' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/settings/notifications', label: 'Alert settings' },
    ],
  },
  ADMIN: {
    eyebrow: 'Campus home',
    title: 'Return here to pivot between governance, approvals, operations, and analytics.',
    description:
      'Admins can use this shared home page as a neutral start point before opening control-room workflows and platform oversight.',
    quickLinks: [
      { to: '/admin/resources', label: 'Manage resources' },
      { to: '/admin/bookings', label: 'Review bookings' },
      { to: '/admin/users', label: 'Manage users' },
    ],
  },
}

function QuickLinkCard({ to, label }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-4 text-sm font-semibold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

export function CampusHomePage() {
  const { user } = useAuth()
  const dashboardPath = getDashboardPath(user.role)
  const rolePanel = rolePanels[user.role] || rolePanels.USER

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-[color-mix(in_srgb,var(--primary)_18%,var(--border))] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--surface))_0%,color-mix(in_srgb,var(--secondary)_18%,var(--surface))_100%)] p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--secondary)]">{rolePanel.eyebrow}</p>
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {rolePanel.title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[var(--muted-text)]">{rolePanel.description}</p>

            <div className="flex flex-wrap gap-3">
              <Link
                to={dashboardPath}
                className="btn-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Open dashboard
                <LayoutDashboard className="h-4 w-4" />
              </Link>
              <Link
                to="/notifications"
                className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[var(--text)]"
              >
                Check notifications
                <BellRing className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              {
                icon: Building2,
                title: 'Shared signed-in home',
                description: `Every role can return to ${APP_HOME_PATH} without hitting the public landing redirect.`,
              },
              {
                icon: ShieldCheck,
                title: 'Role-safe navigation',
                description: 'Home is common, while dashboard and module access still follow backend-enforced role boundaries.',
              },
              {
                icon: Sparkles,
                title: 'Fast re-entry point',
                description: 'Use the brand area or profile menu to get back here from any protected page.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <article key={title} className="surface-soft-panel rounded-[24px] px-5 py-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#60a5fa_0%,#2dd4bf_100%)] text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--heading-color)]">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted-text)]">{description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Signed-in profile</p>
          <h2 className="mt-4 font-display text-3xl font-semibold">You are operating as {user.role}</h2>
          <div className="mt-5 grid gap-3 text-sm text-[var(--text-muted)] sm:grid-cols-2">
            <p>
              Full name: <span className="font-semibold text-[var(--text)]">{user.fullName}</span>
            </p>
            <p>
              Campus ID: <span className="font-semibold text-[var(--text)]">{user.campusId}</span>
            </p>
            <p>
              Email: <span className="font-semibold text-[var(--text)]">{user.email}</span>
            </p>
            <p>
              Access mode: <span className="font-semibold text-[var(--text)]">{user.authProviderType}</span>
            </p>
          </div>
        </div>

        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Quick links</p>
          <div className="mt-5 grid gap-3">
            {rolePanel.quickLinks.map((link) => (
              <QuickLinkCard key={link.to} {...link} />
            ))}
            <QuickLinkCard to="/settings/notifications" label="Notification settings" />
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <Wrench className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-semibold">Navigation is now explicit for signed-in users</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-muted)]">
              The protected app now has a true home destination. Users can reach it from the top brand area and the
              profile menu, while role dashboards remain separate workspaces for day-to-day operations.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
