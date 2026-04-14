import {
  AlertTriangle,
  CheckCheck,
  Search,
  ShieldCheck,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { api, toApiError } from '../../../lib/api.js'
import {
  bookingStatusOptions,
  canAdminApproveBooking,
  canAdminCancelBooking,
  canAdminRejectBooking,
  formatBookingWindow,
} from '../api/bookings.js'
import { BookingStatusBadge } from '../components/BookingStatusBadge.jsx'

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="font-display mt-3 text-3xl font-semibold">{value}</p>
    </div>
  )
}

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [actionDraft, setActionDraft] = useState({ id: null, type: null, reason: '' })
  const [busyBookingId, setBusyBookingId] = useState(null)
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())

  const loadBookings = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/api/admin/bookings', {
        params: { status: statusFilter || undefined },
      })
      setBookings(response.data)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load the admin booking queue.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [statusFilter])

  const filteredBookings = useMemo(() => {
    if (!deferredSearch) {
      return bookings
    }

    return bookings.filter((booking) =>
      [booking.resourceName, booking.userName, booking.purpose]
        .join(' ')
        .toLowerCase()
        .includes(deferredSearch),
    )
  }, [bookings, deferredSearch])

  const summary = useMemo(() => {
    const totals = {
      total: bookings.length,
      pending: 0,
      approved: 0,
      needsDecision: 0,
    }

    bookings.forEach((booking) => {
      if (booking.status === 'PENDING') {
        totals.pending += 1
      }
      if (booking.status === 'APPROVED') {
        totals.approved += 1
      }
      if (canAdminApproveBooking(booking.status) || canAdminCancelBooking(booking.status)) {
        totals.needsDecision += 1
      }
    })

    return totals
  }, [bookings])

  const handleApprove = async (bookingId) => {
    setBusyBookingId(bookingId)
    setError('')

    try {
      const response = await api.put(`/api/admin/bookings/${bookingId}/approve`)
      setBookings((current) => current.map((booking) => (booking.id === bookingId ? response.data : booking)))
      setSuccessMessage('Booking approved successfully.')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not approve this booking.').message)
    } finally {
      setBusyBookingId(null)
    }
  }

  const handleDecision = async () => {
    if (!actionDraft.id || !actionDraft.type) {
      return
    }

    if (!actionDraft.reason.trim()) {
      setError('A reason is required for booking rejection or admin cancellation.')
      return
    }
    if (actionDraft.reason.trim().length > 500) {
      setError('Workflow reasons must be 500 characters or fewer.')
      return
    }

    setBusyBookingId(actionDraft.id)
    setError('')

    try {
      const endpoint =
        actionDraft.type === 'reject'
          ? `/api/admin/bookings/${actionDraft.id}/reject`
          : `/api/admin/bookings/${actionDraft.id}/cancel`

      const response = await api.put(endpoint, {
        reason: actionDraft.reason,
      })

      setBookings((current) => current.map((booking) => (booking.id === actionDraft.id ? response.data : booking)))
      setSuccessMessage(
        actionDraft.type === 'reject'
          ? 'Booking rejected with a recorded reason.'
          : 'Booking cancelled with an audit reason.',
      )
      setActionDraft({ id: null, type: null, reason: '' })
    } catch (requestError) {
      const apiError = toApiError(requestError, 'Could not update this booking.')
      setError(apiError.message)
    } finally {
      setBusyBookingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Admin bookings</p>
            <h1 className="font-display mt-4 text-4xl font-semibold">Approval queue and workflow control</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              Review pending requests, confirm the final conflict check before approval, and record reasons for every
              rejection or admin cancellation.
            </p>
          </div>

          <button
            type="button"
            onClick={loadBookings}
            className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-5 py-3.5 text-sm font-semibold"
          >
            <ShieldCheck className="h-4 w-4" />
            Refresh queue
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Visible bookings" value={summary.total} />
        <SummaryCard label="Pending approval" value={summary.pending} />
        <SummaryCard label="Still actionable" value={summary.needsDecision} />
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
            placeholder="Search by resource, requester, or purpose"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none"
        >
          {bookingStatusOptions.map((option) => (
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
                key={`admin-bookings-skeleton-${index}`}
                className="animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="h-6 w-2/5 rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-2 h-4 w-3/5 rounded-full bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <p className="font-display mt-4 text-2xl font-semibold">No bookings match this view</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              Try clearing the status filter or widening the search to bring more requests back into the approval queue.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <article key={booking.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl font-semibold">{booking.resourceName}</h2>
                      <BookingStatusBadge status={booking.status} />
                    </div>

                    <div className="grid gap-3 text-sm text-[var(--text-muted)] sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4" />
                        <span>{booking.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCheck className="h-4 w-4" />
                        <span>{formatBookingWindow(booking.bookingDate, booking.startTime, booking.endTime)}</span>
                      </div>
                    </div>

                    <p className="text-sm leading-7 text-[var(--text-muted)]">{booking.purpose}</p>

                    <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text)]">Expected attendees:</span> {booking.expectedAttendees}
                    </div>

                    {booking.statusReason ? (
                      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--text)]">Workflow note:</span> {booking.statusReason}
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full max-w-[360px] space-y-3">
                    {canAdminApproveBooking(booking.status) ||
                    canAdminRejectBooking(booking.status) ||
                    canAdminCancelBooking(booking.status) ? (
                      <>
                        {canAdminApproveBooking(booking.status) ? (
                          <button
                            type="button"
                            onClick={() => handleApprove(booking.id)}
                            disabled={busyBookingId === booking.id}
                            className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-sm font-semibold disabled:opacity-60"
                          >
                            <CheckCheck className="h-4 w-4" />
                            {busyBookingId === booking.id ? 'Approving...' : 'Approve booking'}
                          </button>
                        ) : null}

                        {canAdminRejectBooking(booking.status) ? (
                          <button
                            type="button"
                            onClick={() => setActionDraft({ id: booking.id, type: 'reject', reason: '' })}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[var(--danger)]/20 px-4 py-3 text-sm font-semibold text-[var(--danger)]"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject with reason
                          </button>
                        ) : null}

                        {canAdminCancelBooking(booking.status) ? (
                          <button
                            type="button"
                            onClick={() => setActionDraft({ id: booking.id, type: 'cancel', reason: '' })}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                          >
                            Admin cancel
                          </button>
                        ) : null}
                      </>
                    ) : (
                      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 text-sm text-[var(--text-muted)]">
                        This booking is already in a final state. The queue keeps it visible for audit history.
                      </div>
                    )}

                    {actionDraft.id === booking.id ? (
                      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                        <label className="block space-y-2">
                          <span className="text-sm font-semibold">
                            {actionDraft.type === 'reject' ? 'Rejection reason' : 'Admin cancellation reason'}
                          </span>
                          <textarea
                            rows="4"
                            value={actionDraft.reason}
                            onChange={(event) =>
                              setActionDraft((current) => ({ ...current, reason: event.target.value }))
                            }
                            placeholder="Explain the decision clearly for the request history."
                            className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
                          />
                        </label>
                        <div className="mt-4 flex gap-3">
                          <button
                            type="button"
                            onClick={handleDecision}
                            disabled={busyBookingId === booking.id}
                            className="btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold disabled:opacity-60"
                          >
                            {busyBookingId === booking.id ? 'Saving...' : 'Save decision'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionDraft({ id: null, type: null, reason: '' })}
                            className="inline-flex flex-1 items-center justify-center rounded-[18px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    ) : null}
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

