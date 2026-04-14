import {
  ArrowRight,
  CheckCheck,
  Search,
  ShieldCheck,
  UserRoundCog,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, toApiError } from '../../../lib/api.js'
import {
  canAdminClose,
  canTechnicianMoveToInProgress,
  canTechnicianResolve,
  formatTicketPriority,
  ticketStatusOptions,
} from '../api/tickets.js'
import { TicketStatusBadge } from '../components/TicketStatusBadge.jsx'

export function AdminTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [assignmentDrafts, setAssignmentDrafts] = useState({})
  const [noteDrafts, setNoteDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [busyTicketId, setBusyTicketId] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [ticketsResponse, usersResponse] = await Promise.all([
        api.get('/api/admin/tickets', {
          params: { status: statusFilter || undefined },
        }),
        api.get('/api/admin/users'),
      ])

      setTickets(ticketsResponse.data)
      setTechnicians(usersResponse.data.filter((user) => user.role === 'TECHNICIAN' && user.accountStatus === 'ACTIVE'))
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load the admin ticket workspace.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const visibleTickets = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return tickets
    }

    return tickets.filter((ticket) =>
      [ticket.resourceName, ticket.reporterName, ticket.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [search, tickets])

  const updateLocalTicket = (responseTicket) => {
    setTickets((current) => current.map((ticket) => (ticket.id === responseTicket.id ? responseTicket : ticket)))
  }

  const assignTechnician = async (ticketId) => {
    const technicianId = assignmentDrafts[ticketId]
    if (!technicianId) {
      setError('Choose a technician before assigning the ticket.')
      return
    }

    setBusyTicketId(ticketId)
    setError('')

    try {
      const response = await api.put(`/api/admin/tickets/${ticketId}/assign`, { technicianId })
      updateLocalTicket(response.data)
      setSuccessMessage('Technician assigned successfully.')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not assign this ticket.').message)
    } finally {
      setBusyTicketId('')
    }
  }

  const updateStatus = async (ticketId, status) => {
    setBusyTicketId(ticketId)
    setError('')

    try {
      const response = await api.put(`/api/admin/tickets/${ticketId}/status`, { status })
      updateLocalTicket(response.data)
      setSuccessMessage('Ticket status updated.')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not update this ticket.').message)
    } finally {
      setBusyTicketId('')
    }
  }

  const rejectTicket = async (ticketId) => {
    const reason = noteDrafts[ticketId]?.trim()
    if (!reason) {
      setError('A rejection reason is required.')
      return
    }
    if (reason.length > 1000) {
      setError('Rejection reasons must be 1000 characters or fewer.')
      return
    }

    setBusyTicketId(ticketId)
    setError('')

    try {
      const response = await api.put(`/api/admin/tickets/${ticketId}/reject`, { reason })
      updateLocalTicket(response.data)
      setSuccessMessage('Ticket rejected with a recorded reason.')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not reject this ticket.').message)
    } finally {
      setBusyTicketId('')
    }
  }

  const saveResolution = async (ticketId) => {
    const resolutionNotes = noteDrafts[ticketId]?.trim()
    if (!resolutionNotes) {
      setError('Resolution notes cannot be empty.')
      return
    }
    if (resolutionNotes.length > 2000) {
      setError('Resolution notes must be 2000 characters or fewer.')
      return
    }

    setBusyTicketId(ticketId)
    setError('')

    try {
      const response = await api.put(`/api/admin/tickets/${ticketId}/resolution`, { resolutionNotes })
      updateLocalTicket(response.data)
      setSuccessMessage('Resolution notes saved.')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not save the resolution notes.').message)
    } finally {
      setBusyTicketId('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Admin tickets</p>
            <h1 className="font-display mt-4 text-4xl font-semibold">Assignment, moderation, and closure workspace</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              Route tickets to active technicians, record final decisions, and keep the maintenance workflow aligned
              with the approved state machine.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-5 py-3.5 text-sm font-semibold"
          >
            <ShieldCheck className="h-4 w-4" />
            Refresh workspace
          </button>
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

      <section className="grid gap-3 rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by resource, reporter, or issue"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none"
        >
          {ticketStatusOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`admin-ticket-skeleton-${index}`}
                className="animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="h-6 w-2/5 rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : visibleTickets.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-muted)]">
            No tickets match this view.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleTickets.map((ticket) => (
              <article key={ticket.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl font-semibold">{ticket.resourceName || 'General issue'}</h2>
                      <TicketStatusBadge status={ticket.status} />
                    </div>

                    <p className="text-sm leading-7 text-[var(--text-muted)]">{ticket.description}</p>

                    <div className="flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
                      <span>Reporter {ticket.reporterName}</span>
                      <span>Priority {formatTicketPriority(ticket.priority)}</span>
                      <span>Assigned {ticket.assignedTechnicianName || 'Unassigned'}</span>
                    </div>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Technician assignment</span>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                          value={assignmentDrafts[ticket.id] || ticket.assignedTechnicianId || ''}
                          onChange={(event) =>
                            setAssignmentDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))
                          }
                          className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
                        >
                          <option value="">Choose technician</option>
                          {technicians.map((technician) => (
                            <option key={technician.id} value={technician.id}>
                              {technician.fullName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => assignTechnician(ticket.id)}
                          disabled={busyTicketId === ticket.id}
                          className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                        >
                          <UserRoundCog className="h-4 w-4" />
                          Assign
                        </button>
                      </div>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Admin notes</span>
                      <textarea
                        rows="4"
                        value={noteDrafts[ticket.id] ?? ticket.resolutionNotes ?? ticket.rejectionReason ?? ''}
                        onChange={(event) =>
                          setNoteDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))
                        }
                        placeholder="Use this space for rejection reasons or resolution notes."
                        className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
                      />
                    </label>
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
                        Move to in progress
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
                        Mark resolved
                      </button>
                    ) : null}

                    {canAdminClose(ticket) ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(ticket.id, 'CLOSED')}
                        disabled={busyTicketId === ticket.id}
                        className="inline-flex w-full items-center justify-center rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                      >
                        Close ticket
                      </button>
                    ) : null}

                    {ticket.status === 'OPEN' ? (
                      <button
                        type="button"
                        onClick={() => rejectTicket(ticket.id)}
                        disabled={busyTicketId === ticket.id}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[var(--danger)]/20 px-4 py-3 text-sm font-semibold text-[var(--danger)]"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject with reason
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => saveResolution(ticket.id)}
                      disabled={busyTicketId === ticket.id}
                      className="inline-flex w-full items-center justify-center rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                    >
                      Save notes
                    </button>

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

