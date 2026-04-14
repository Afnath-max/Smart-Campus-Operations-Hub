import { Activity, BellRing, CalendarDays, LayoutDashboard, Sparkles, Wrench } from 'lucide-react'

function ModuleCard({ icon: Icon, title, description, status }) {
  return (
    <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
          {status}
        </span>
      </div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{description}</p>
    </article>
  )
}

function Overview({ eyebrow, title, body, cards }) {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{eyebrow}</p>
        <h1 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">{body}</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {cards.map((card) => (
          <ModuleCard key={card.title} {...card} />
        ))}
      </section>
    </div>
  )
}

export function UserDashboardPage() {
  return (
    <Overview
      eyebrow="USER dashboard"
      title="Booking, reporting, and updates will land here first."
      body="This skeleton confirms Phase 1 role loading, route protection, and session-backed dashboard redirects for campus users."
      cards={[
        {
          icon: CalendarDays,
          title: 'Facility bookings',
          description: 'Upcoming resource search, conflict-aware booking requests, and personal reservation history.',
          status: 'Phase 2',
        },
        {
          icon: Wrench,
          title: 'Tickets & incidents',
          description: 'Maintenance reporting, image uploads, and threaded request updates will expand from this slot.',
          status: 'Phase 4',
        },
        {
          icon: BellRing,
          title: 'Notifications',
          description: 'Approval updates, status changes, and unread counts will surface here once notification rules land.',
          status: 'Phase 5',
        },
      ]}
    />
  )
}

export function TechnicianDashboardPage() {
  return (
    <Overview
      eyebrow="TECHNICIAN dashboard"
      title="Assigned work, SLA visibility, and ticket flow are queued next."
      body="This skeleton proves that technician-only access stays isolated from user and admin routes while the shared shell stays role-aware."
      cards={[
        {
          icon: Wrench,
          title: 'Assigned tickets',
          description: 'Technician queues, in-progress work, and resolution notes will anchor this view.',
          status: 'Phase 4',
        },
        {
          icon: Activity,
          title: 'Service timelines',
          description: 'SLA clocks, workload states, and operational alerts will appear once ticket lifecycle metrics land.',
          status: 'Phase 5',
        },
        {
          icon: BellRing,
          title: 'Role notifications',
          description: 'Assignment changes, ticket comments, and updates will plug into the notification center here.',
          status: 'Phase 5',
        },
      ]}
    />
  )
}

export function AdminDashboardPage() {
  return (
    <Overview
      eyebrow="ADMIN dashboard"
      title="Approvals, user governance, and campus analytics are staged from here."
      body="This skeleton confirms admin-only routing and gives Phase 2 through Phase 5 modules a shared control-room surface for expansion."
      cards={[
        {
          icon: LayoutDashboard,
          title: 'Resources & bookings',
          description: 'Resource CRUD, approval queues, and booking conflict oversight will build directly into this control surface.',
          status: 'Phase 2-3',
        },
        {
          icon: Wrench,
          title: 'Maintenance operations',
          description: 'Technician assignment, status moderation, and attachment control are reserved for the ticketing module.',
          status: 'Phase 4',
        },
        {
          icon: Sparkles,
          title: 'Analytics & innovation',
          description: 'Overview stats, SLA metrics, notification preferences, and QR booking support will finalize the hub.',
          status: 'Phase 5',
        },
      ]}
    />
  )
}
