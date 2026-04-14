import { House, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_HOME_PATH } from '../../lib/routes.js'
import { ThemeSwitcher } from '../ThemeSwitcher.jsx'
import { ProfileMenu } from './ProfileMenu.jsx'

export function ProtectedTopBar({ user, onOpenMenu, dashboardPath }) {
  return (
    <header className="sticky top-0 z-20 px-4 pt-4 pb-3 sm:px-7 lg:px-8">
      <div className="rounded-[28px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-strong)_94%,var(--bg)_6%)] px-3 py-3 backdrop-blur-2xl sm:px-5 sm:py-3.5">
        <div className="flex flex-col gap-3 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onOpenMenu}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              to={APP_HOME_PATH}
              className="flex min-w-0 items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 transition hover:border-[var(--primary)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <House className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-semibold text-[var(--text)] sm:text-base">
                  Smart Campus
                </span>
                <span className="block truncate text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] sm:text-xs sm:tracking-[0.22em]">
                  Campus home
                </span>
              </span>
            </Link>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-2 min-[420px]:justify-end sm:gap-3">
            <ThemeSwitcher compact />
            <ProfileMenu user={user} compact />
          </div>
        </div>
      </div>
    </header>
  )
}
