import { ArrowRight, CheckCheck, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, toApiError } from '../../../lib/api.js'
import {
  canTechnicianMoveToInProgress,
  canTechnicianResolve,
  formatTicketPriority,
  ticketStatusOptions,
} from '../api/tickets.js'
import { TicketStatusBadge } from '../components/TicketStatusBadge.jsx'

export function TechnicianTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyTicketId, setBusyTicketId] = useState('')

  const loadTickets = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/api/technician/tickets/assigned', {
        params: { status: statusFilter || undefined },
      })
      setTickets(response.data)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load the assigned technician queue.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [statusFilter])

  const updateStatus = async (ticketId, status) => {
    setBusyTicketId(ticketId)
    setError('')

    try {
      const response = await api.put(`/api/tickets/${ticketId}/status`, { status })
      setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? response.data : ticket)))
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not update this ticket.').message)
    } finally {
      setBusyTicketId('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Technician queue</p>
        <h1 className="font-display mt-4 text-4xl font-semibold">Assigned tickets and live workflow control</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
          Keep your assigned queue moving, open each ticket for evidence and comments, and update status without
          leaving the technician workspace.
        </p>
      </section>

      {error ? (
        <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-5 py-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none"
          >
            {ticketStatusOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`tech-ticket-skeleton-${index}`}
                className="animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="h-6 w-2/5 rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-muted)]">
            No assigned tickets match this view.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl font-semibold">{ticket.resourceName || 'General issue'}</h2>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    <p className="text-sm leading-7 text-[var(--text-muted)]">{ticket.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
                      <span>Priority {formatTicketPriority(ticket.priority)}</span>
                      <span>{ticket.commentCount} comments</span>
                    </div>
                  </div>

                  <div className="w-full max-w-[320px] space-y-3">
                    {canTechnicianMoveToInProgress(ticket) ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')}
                        disabled={busyTicketId === ticket.id}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                      >
                        <CheckCheck className="h-4 w-4" />
                        {busyTicketId === ticket.id ? 'Updating...' : 'Move to in progress'}
                      </button>
                    ) : null}

                    {canTechnicianResolve(ticket) ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(ticket.id, 'RESOLVED')}
                        disabled={busyTicketId === ticket.id}
                        className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-sm font-semibold"
                      >
                        <CheckCheck className="h-4 w-4" />
                        {busyTicketId === ticket.id ? 'Updating...' : 'Mark resolved'}
                      </button>
                    ) : null}

                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                    >
                      Open ticket
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

