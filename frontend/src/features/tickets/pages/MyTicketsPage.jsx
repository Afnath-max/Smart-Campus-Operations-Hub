import {
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Paperclip,
  Plus,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, toApiError } from '../../../lib/api.js'
import { formatTicketPriority } from '../api/tickets.js'
import { TicketStatusBadge } from '../components/TicketStatusBadge.jsx'

function TicketSummaryCard({ ticket }) {
  return (
    <article className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{ticket.category}</p>
          <h2 className="font-display mt-2 text-2xl font-semibold">{ticket.resourceName || 'General operations issue'}</h2>
        </div>
        <TicketStatusBadge status={ticket.status} />
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">{ticket.description}</p>

      <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
        <span>Priority {formatTicketPriority(ticket.priority)}</span>
        <span>{ticket.imageCount} images</span>
        <span>{ticket.commentCount} comments</span>
      </div>

      <Link
        to={`/tickets/${ticket.id}`}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
      >
        Open details
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  )
}

export function MyTicketsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/api/tickets/my')
        setTickets(response.data)
      } catch (requestError) {
        setError(toApiError(requestError, 'Could not load your tickets right now.').message)
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [])

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">My tickets</p>
            <h1 className="font-display mt-4 text-4xl font-semibold">Track issues from report to resolution</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              Every maintenance and incident ticket you submit appears here with live status, comment history, and
              attachment counts.
            </p>
          </div>

          <Link
            to="/tickets/new"
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-3.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            New ticket
          </Link>
        </div>
      </section>

      {successMessage ? (
        <div className="rounded-[24px] border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-5 py-4 text-sm text-[var(--primary)]">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-5 py-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`my-tickets-skeleton-${index}`}
                className="animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="h-6 w-2/5 rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-2 h-4 w-3/5 rounded-full bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <p className="font-display mt-4 text-2xl font-semibold">No tickets yet</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              Open a new maintenance or incident ticket whenever you need campus operations support.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/tickets/new"
                className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              >
                <Paperclip className="h-4 w-4" />
                Report issue
              </Link>
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
              >
                <MessageSquare className="h-4 w-4" />
                Browse resources
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {tickets.map((ticket) => (
              <TicketSummaryCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

