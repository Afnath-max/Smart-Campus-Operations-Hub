import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const platformColumns = [
  {
    title: 'Access',
    eyebrow: 'Identity + role truth',
    summary:
      'Local campus credentials and Google identity converge into one backend role model, one account state, and one consistent redirect path.',
    bullets: [
      'USER self-registration only',
      'Invite-only admin and technician onboarding',
      'Disabled accounts blocked across every sign-in path',
    ],
  },
  {
    title: 'Operations',
    eyebrow: 'Resource control',
    summary:
      'Catalogue browsing, booking workflows, and maintenance coordination share the same operational context instead of living in disconnected tools.',
    bullets: [
      'Resource availability windows',
      'Conflict-aware booking approvals',
      'Technician and admin work queues',
    ],
  },
  {
    title: 'Signals',
    eyebrow: 'Meaningful notifications',
    summary:
      'Notifications stay tied to actual approvals, ticket changes, assignments, and comments, with preferences and unread visibility built in.',
    bullets: ['No duplicate alert noise', 'Unread counts across roles', 'Alert settings that persist by account'],
  },
]

const roleFlows = [
  {
    role: 'USER',
    headline: 'Find space, book resources, raise issues, and track every request from one dashboard.',
    steps: [
      'Browse active facilities and assets',
      'Submit booking requests with validation',
      'Create and monitor maintenance tickets',
    ],
  },
  {
    role: 'TECHNICIAN',
    headline: 'Move through assigned work with a queue tuned for response time, ticket status, and service ownership.',
    steps: [
      'Review assigned tickets',
      'Update status and resolution notes',
      'Coordinate through comments and alert trails',
    ],
  },
  {
    role: 'ADMIN',
    headline: 'Control approvals, staffing, user access, analytics, and operational policy from the control room.',
    steps: [
      'Manage resources, users, and invitations',
      'Approve or reject booking and ticket workflows',
      'Watch analytics, SLA, and platform signals',
    ],
  },
]

const governanceSignals = [
  {
    label: 'Role-aware dashboards',
    value: '3',
    detail: 'USER, TECHNICIAN, and ADMIN each land in the correct workspace with backend enforcement.',
  },
  {
    label: 'Operational lanes',
    value: '4',
    detail: 'Resources, bookings, maintenance, and notifications stay connected through the same product model.',
  },
  {
    label: 'Workflow state changes',
    value: '11+',
    detail: 'Approvals, ticket progression, comment ownership, and read-state transitions stay intentional end to end.',
  },
]

export function LandingPage() {
  return (
    <div className="space-y-24 pb-20">
      <section id="home" className="scroll-mt-28">
        <div className="overflow-hidden rounded-[42px] border border-[color-mix(in_srgb,var(--primary)_18%,var(--border))] bg-[linear-gradient(148deg,color-mix(in_srgb,var(--background)_22%,#07111d)_0%,color-mix(in_srgb,var(--primary)_18%,var(--surface))_48%,color-mix(in_srgb,var(--secondary)_18%,var(--surface))_100%)] text-[var(--text)] shadow-[var(--shadow)]">
          <div className="grid lg:grid-cols-[0.96fr_1.04fr]">
            <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
              <div className="space-y-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--primary)_22%,transparent)] bg-[color-mix(in_srgb,var(--surface-elevated)_88%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--heading-color)]">
                  <ShieldCheck className="h-4 w-4" />
                  University operations in one governed product
                </span>

                <div className="space-y-5">
                  <p className="font-display text-2xl font-semibold text-[var(--heading-color)] sm:text-3xl">
                    Smart Campus Operations Hub
                  </p>
                  <h1 className="max-w-2xl font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">
                    One control surface for campus rooms, assets, incidents, and approvals.
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-[var(--muted-text)] sm:text-lg">
                    Replace scattered forms and inbox threads with one role-aware platform for facilities, bookings,
                    maintenance, notifications, and operational visibility.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/login"
                    className="btn-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    Sign in to your workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/register"
                    className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[var(--text)]"
                  >
                    Create a USER account
                  </Link>
                </div>

                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  {[
                    'Backend-enforced role loading and route redirects',
                    'Conflict-safe booking and ticket workflows',
                    'Theme-aware dashboards for desktop and mobile',
                    'Notifications, analytics, and deployment-ready structure',
                  ].map((item) => (
                    <div key={item} className="surface-soft-panel flex items-start gap-3 rounded-[22px] px-4 py-4">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--secondary)]" />
                      <p className="text-sm leading-7 text-[var(--text)]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative min-h-[460px] overflow-hidden border-t border-white/10 px-6 py-8 sm:px-8 lg:min-h-[620px] lg:border-l lg:border-t-0 lg:px-10 lg:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.22),transparent_32%)]" />
              <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(color-mix(in_srgb,var(--border)_52%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--border)_52%,transparent)_1px,transparent_1px)] [background-size:44px_44px]" />

              <div className="relative flex h-full flex-col justify-between gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  {['Bookings validated', 'Tickets assigned', 'Alerts routed'].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[color-mix(in_srgb,var(--border)_78%,transparent)] bg-[color-mix(in_srgb,var(--surface-elevated)_84%,transparent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--heading-color)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: 'Resource scheduling stays clean',
                      copy: 'Only active facilities accept requests, and final overlap checks stay on the backend before approval.',
                      icon: CalendarCheck2,
                    },
                    {
                      title: 'Maintenance work moves with ownership',
                      copy: 'Technician queues, assignment changes, comments, and status updates stay inside one accountable thread.',
                      icon: Wrench,
                    },
                    {
                      title: 'Approvals produce useful signals',
                      copy: 'Unread counts, alert settings, and analytics are attached to meaningful workflow changes instead of generic noise.',
                      icon: BellRing,
                    },
                  ].map(({ title, copy, icon: Icon }) => (
                    <div
                      key={title}
                      className="rounded-[26px] border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-elevated)_90%,transparent),color-mix(in_srgb,var(--surface-overlay)_74%,transparent))] px-5 py-5 backdrop-blur-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-[var(--heading-color)]">{title}</p>
                          <p className="max-w-xl text-sm leading-7 text-[var(--muted-text)]">{copy}</p>
                        </div>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#60a5fa_0%,#2dd4bf_100%)] text-white">
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-[26px] border border-[color-mix(in_srgb,var(--border)_68%,transparent)] bg-[color-mix(in_srgb,var(--surface-overlay)_84%,transparent)] px-5 py-4 text-sm text-[var(--text)]">
                  <div>
                    <p className="font-semibold">Operational model</p>
                    <p className="mt-1 max-w-xl leading-7 text-[var(--muted-text)]">
                      Identity, booking, ticketing, notifications, and analytics share one governed campus data model.
                    </p>
                  </div>
                  <Sparkles className="hidden h-5 w-5 shrink-0 text-[var(--secondary)] sm:block" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="scroll-mt-28">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">Capabilities</p>
            <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
              The platform is built like an operations product, not a stack of disconnected forms.
            </h2>
            <p className="max-w-xl text-base leading-8 text-[var(--text-muted)]">
              Each surface has a job: establish identity, control access, coordinate work, and surface the signals that
              matter when a campus is actually running.
            </p>
          </div>

          <div className="divide-y divide-[var(--border)] rounded-[34px] border border-[var(--border)] bg-[var(--surface)]">
            {platformColumns.map((column) => (
              <article key={column.title} className="grid gap-5 px-6 py-6 sm:px-8 lg:grid-cols-[0.32fr_0.68fr]">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                    {column.eyebrow}
                  </p>
                  <h3 className="font-display text-3xl font-semibold">{column.title}</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-base leading-8 text-[var(--text-muted)]">{column.summary}</p>
                  <ul className="grid gap-2 text-sm leading-7 text-[var(--text-muted)]">
                    {column.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--primary)]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflows" className="scroll-mt-28">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">Role flows</p>
            <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
              The same product shifts cleanly between requester, technician, and campus admin views.
            </h2>
          </div>

          <div className="divide-y divide-[var(--border)] overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--surface)]">
            {roleFlows.map((flow) => (
              <article key={flow.role} className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[0.22fr_0.48fr_0.3fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">{flow.role}</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold leading-tight">{flow.headline}</p>
                </div>
                <ul className="grid gap-2 text-sm leading-7 text-[var(--text-muted)]">
                  {flow.steps.map((step) => (
                    <li key={step} className="flex items-start gap-3">
                      <BookOpenCheck className="mt-1 h-4 w-4 shrink-0 text-[var(--primary)]" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="governance" className="scroll-mt-28">
        <div className="grid gap-10 rounded-[38px] border border-[var(--border)] bg-[linear-gradient(145deg,var(--surface)_0%,color-mix(in_srgb,var(--surface)_82%,var(--bg-accent)_18%)_100%)] px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">Governance</p>
            <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Designed to stay reliable when access, approvals, and service queues actually matter.
            </h2>
            <p className="max-w-xl text-base leading-8 text-[var(--text-muted)]">
              Backend role checks stay authoritative, frontend route guards stay aligned, and every later module builds on
              the same trust model instead of bypassing it.
            </p>
          </div>

          <div className="grid gap-4">
            {governanceSignals.map((signal) => (
              <article
                key={signal.label}
                className="grid gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-5 sm:grid-cols-[0.2fr_0.8fr]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-4xl font-semibold text-[var(--primary)]">{signal.value}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">{signal.label}</p>
                  <p className="text-sm leading-7 text-[var(--text-muted)]">{signal.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="scroll-mt-28">
        <div className="rounded-[38px] border border-[var(--border)] bg-[var(--surface)] px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--primary)]">Start</p>
              <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
                Enter the workspace that matches your campus role.
              </h2>
              <p className="text-base leading-8 text-[var(--text-muted)]">
                Standard users can register directly, while technician and admin access remains controlled through
                invitation and pre-created accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="btn-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Sign in
                <LayoutDashboard className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Create a USER account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
