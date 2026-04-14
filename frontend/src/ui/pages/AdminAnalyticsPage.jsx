import { Activity, CalendarRange, RefreshCw, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api, toApiError } from '../../lib/api.js'
import { formatBookingStatus } from '../../features/bookings/api/bookings.js'
import { formatResourceType } from '../../features/resources/api/resources.js'
import { formatTicketPriority, formatTicketStatus } from '../../features/tickets/api/tickets.js'

const compactNumber = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
})

function formatLabel(value) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function StatCard({ eyebrow, title, value, tone = 'default' }) {
  const toneClass =
    tone === 'accent'
      ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
      : tone === 'warning'
        ? 'bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]'
        : 'bg-[var(--surface)] text-[var(--text)]'

  return (
    <article className={`rounded-[28px] border border-[var(--border)] p-5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{eyebrow}</p>
      <p className="font-display mt-4 text-4xl font-semibold">{value}</p>
      <p className="mt-3 text-sm leading-7 opacity-80">{title}</p>
    </article>
  )
}

function BarList({ formatter = (label) => label, items, title }) {
  const maxValue = useMemo(() => {
    if (!items.length) {
      return 1
    }

    return Math.max(...items.map((item) => item.value), 1)
  }, [items])

  return (
    <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <p className="font-display text-2xl font-semibold">{title}</p>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold">{formatter(item.label)}</span>
              <span className="text-[var(--text-muted)]">{item.value}</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--surface)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ResourceTable({ resources }) {
  return (
    <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-semibold">Top booked resources</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Most requested spaces and assets across booking activity</p>
        </div>
        <CalendarRange className="h-5 w-5 text-[var(--text-muted)]" />
      </div>

      {resources.length === 0 ? (
        <p className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
          No bookings have been recorded yet, so the resource ranking will appear once requests start flowing.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-3 font-semibold">Resource</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Requests</th>
                <th className="px-3 py-3 font-semibold">Approved</th>
                <th className="px-3 py-3 font-semibold">Projected attendees</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.resourceId} className="border-t border-[var(--border)]">
                  <td className="px-3 py-4">
                    <div>
                      <p className="font-semibold">{resource.resourceName}</p>
                      <p className="mt-1 text-[var(--text-muted)]">{resource.location}</p>
                    </div>
                  </td>
                  <td className="px-3 py-4">{formatResourceType(resource.resourceType)}</td>
                  <td className="px-3 py-4">{resource.totalRequests}</td>
                  <td className="px-3 py-4">{resource.approvedBookings}</td>
                  <td className="px-3 py-4">{resource.projectedAttendees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function SlaBreakdown({ sla }) {
  return (
    <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-semibold">SLA posture</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Priority-target tracking for active and resolved ticket queues
          </p>
        </div>
        <Activity className="h-5 w-5 text-[var(--text-muted)]" />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <StatCard eyebrow="Resolved on time" title="Tickets completed within target" value={sla.resolvedWithinTarget} tone="accent" />
        <StatCard eyebrow="Active at risk" title="Open tickets approaching breach" value={sla.activeAtRisk} />
        <StatCard eyebrow="Breached" title="Active or resolved beyond target" value={sla.resolvedBreached + sla.activeBreached} tone="warning" />
      </div>

      <div className="mt-5 space-y-4">
        {sla.priorityBreakdown.map((priority) => (
          <article key={priority.priority} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold">{formatTicketPriority(priority.priority)}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {priority.targetHours}h target • avg resolution {compactNumber.format(priority.averageResolutionHours)}h
                </p>
              </div>

              <div className="grid gap-3 text-sm text-[var(--text-muted)] sm:grid-cols-3">
                <span>Within target {priority.withinTarget}</span>
                <span>At risk {priority.atRisk}</span>
                <span>Breached {priority.breached}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAnalytics = async () => {
    setLoading(true)
    setError('')

    try {
      const [overview, bookings, tickets, resources, sla] = await Promise.all([
        api.get('/api/admin/stats/overview'),
        api.get('/api/admin/stats/bookings'),
        api.get('/api/admin/stats/tickets'),
        api.get('/api/admin/stats/resources/top'),
        api.get('/api/admin/stats/sla'),
      ])

      setAnalytics({
        overview: overview.data,
        bookings: bookings.data,
        tickets: tickets.data,
        resources: resources.data,
        sla: sla.data,
      })
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load the analytics workspace.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Admin analytics</p>
            <h1 className="font-display mt-4 text-4xl font-semibold">Campus throughput, queue pressure, and service posture</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              Monitor request volume, ticket backlog, high-usage resources, and SLA pressure from one operational view.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-5 py-3.5 text-sm font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh analytics
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-5 py-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      {loading || !analytics ? (
        <section className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`analytics-skeleton-${index}`}
              className="animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-5"
            >
              <div className="h-4 w-2/5 rounded-full bg-[var(--surface-muted)]" />
              <div className="mt-4 h-10 w-1/3 rounded-full bg-[var(--surface-muted)]" />
              <div className="mt-4 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
            </div>
          ))}
        </section>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-4">
            <StatCard eyebrow="Resources" title="Active campus facilities and assets" value={analytics.overview.activeResources} tone="accent" />
            <StatCard eyebrow="Pending bookings" title="Requests waiting on approval" value={analytics.overview.pendingBookings} />
            <StatCard eyebrow="Open tickets" title="Tickets still in the active queue" value={analytics.overview.openTickets} tone="warning" />
            <StatCard eyebrow="Avg resolution" title="Mean hours from create to resolved" value={`${compactNumber.format(analytics.overview.averageResolutionHours)}h`} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <BarList
              title="Booking workflow"
              items={analytics.bookings.statusBreakdown}
              formatter={formatBookingStatus}
            />
            <BarList
              title="Ticket workflow"
              items={analytics.tickets.statusBreakdown}
              formatter={formatTicketStatus}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <BarList
              title="Ticket priorities"
              items={analytics.tickets.priorityBreakdown}
              formatter={formatTicketPriority}
            />
            <BarList
              title="Ticket categories"
              items={analytics.tickets.categoryBreakdown}
              formatter={formatLabel}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <ResourceTable resources={analytics.resources} />

            <section className="space-y-6">
              <BarList title="Booking volume, last 7 days" items={analytics.bookings.dailyVolume} />
              <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-semibold">Operations health</p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">Quick admin summary across active campus services</p>
                  </div>
                  <Wrench className="h-5 w-5 text-[var(--text-muted)]" />
                </div>
                <div className="mt-5 space-y-4 text-sm text-[var(--text-muted)]">
                  <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <span>Total users</span>
                    <span className="font-semibold text-[var(--text)]">{analytics.overview.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <span>Active technicians</span>
                    <span className="font-semibold text-[var(--text)]">{analytics.overview.activeTechnicians}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <span>Out of service resources</span>
                    <span className="font-semibold text-[var(--text)]">{analytics.overview.outOfServiceResources}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <span>Approved bookings</span>
                    <span className="font-semibold text-[var(--text)]">{analytics.overview.approvedBookings}</span>
                  </div>
                </div>
              </section>
            </section>
          </section>

          <SlaBreakdown sla={analytics.sla} />
        </>
      )}
    </div>
  )
}

