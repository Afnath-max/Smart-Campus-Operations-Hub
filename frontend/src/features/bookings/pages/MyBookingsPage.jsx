import {
  AlertTriangle,
  CalendarRange,
  LocateFixed,
  Plus,
  QrCode,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, toApiError } from '../../../lib/api.js'
import { canUserCancelBooking, formatBookingWindow } from '../api/bookings.js'
import { BookingStatusBadge } from '../components/BookingStatusBadge.jsx'

function BookingMetric({ label, value }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="font-display mt-3 text-3xl font-semibold">{value}</p>
    </div>
  )
}

export function MyBookingsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [cancelDraft, setCancelDraft] = useState({ id: null, reason: '' })
  const [cancellingId, setCancellingId] = useState(null)
  const [qrDraft, setQrDraft] = useState({ bookingId: null, svg: '', loading: false, error: '' })

  const loadBookings = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/api/bookings/my')
      setBookings(response.data)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load your bookings right now.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  const metrics = useMemo(() => {
    const summary = {
      total: bookings.length,
      pending: 0,
      approved: 0,
      active: 0,
    }

    bookings.forEach((booking) => {
      if (booking.status === 'PENDING') {
        summary.pending += 1
      }
      if (booking.status === 'APPROVED') {
        summary.approved += 1
      }
      if (canUserCancelBooking(booking.status)) {
        summary.active += 1
      }
    })

    return summary
  }, [bookings])

  const handleCancel = async (bookingId) => {
    if (cancelDraft.reason.trim().length > 500) {
      setError('Cancellation notes must be 500 characters or fewer.')
      return
    }

    setCancellingId(bookingId)
    setError('')

    try {
      const response = await api.put(`/api/bookings/${bookingId}/cancel`, {
        reason: cancelDraft.reason.trim() || null,
      })
      setBookings((current) => current.map((booking) => (booking.id === bookingId ? response.data : booking)))
      setCancelDraft({ id: null, reason: '' })
      if (qrDraft.bookingId === bookingId) {
        setQrDraft({ bookingId: null, svg: '', loading: false, error: '' })
      }
      setSuccessMessage('Booking cancelled successfully.')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not cancel this booking.').message)
    } finally {
      setCancellingId(null)
    }
  }

  const handleQrToggle = async (bookingId) => {
    if (qrDraft.bookingId === bookingId && qrDraft.svg && !qrDraft.loading) {
      setQrDraft({ bookingId: null, svg: '', loading: false, error: '' })
      return
    }

    setQrDraft({ bookingId, svg: '', loading: true, error: '' })

    try {
      const response = await api.get(`/api/bookings/${bookingId}/qr`, {
        responseType: 'text',
      })
      setQrDraft({ bookingId, svg: response.data, loading: false, error: '' })
    } catch (requestError) {
      setQrDraft({
        bookingId,
        svg: '',
        loading: false,
        error: toApiError(requestError, 'Could not load the booking QR code.').message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">My bookings</p>
            <h1 className="font-display mt-4 text-4xl font-semibold">Track every request from draft to decision</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              Review pending requests, approved reservations, and final decisions in one place. Cancellation stays
              available only while the workflow still allows it.
            </p>
          </div>

          <Link
            to="/bookings/new"
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-3.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            New booking
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <BookingMetric label="Total requests" value={metrics.total} />
        <BookingMetric label="Pending review" value={metrics.pending} />
        <BookingMetric label="Still cancellable" value={metrics.active} />
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
                key={`my-bookings-skeleton-${index}`}
                className="animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="h-6 w-2/5 rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-2 h-4 w-3/5 rounded-full bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] p-8 text-center">
            <CalendarRange className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <p className="font-display mt-4 text-2xl font-semibold">No bookings yet</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              Start with the resource catalogue, then submit a booking request once you find the right space or asset.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
              >
                Browse catalogue
              </Link>
              <Link
                to="/bookings/new"
                className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              >
                Create booking
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <article key={booking.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl font-semibold">{booking.resourceName}</h2>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm leading-7 text-[var(--text-muted)]">{booking.purpose}</p>
                    <div className="grid gap-3 text-sm text-[var(--text-muted)] sm:grid-cols-2 xl:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4" />
                        <span>{formatBookingWindow(booking.bookingDate, booking.startTime, booking.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4" />
                        <span>{booking.expectedAttendees} attendees</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LocateFixed className="h-4 w-4" />
                        <span>Requested by {booking.userName}</span>
                      </div>
                    </div>
                    {booking.statusReason ? (
                      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--text)]">Workflow note:</span> {booking.statusReason}
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full max-w-[340px] space-y-3">
                    {booking.status === 'APPROVED' ? (
                      <button
                        type="button"
                        onClick={() => handleQrToggle(booking.id)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                      >
                        <QrCode className="h-4 w-4" />
                        {qrDraft.bookingId === booking.id && qrDraft.svg ? 'Hide QR pass' : 'Show QR pass'}
                      </button>
                    ) : null}

                    {canUserCancelBooking(booking.status) ? (
                      cancelDraft.id === booking.id ? (
                        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                          <label className="block space-y-2">
                            <span className="text-sm font-semibold">Cancellation note</span>
                            <textarea
                              rows="4"
                              value={cancelDraft.reason}
                              onChange={(event) => setCancelDraft({ id: booking.id, reason: event.target.value })}
                              placeholder="Optional reason for this cancellation."
                              className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
                            />
                          </label>
                          <div className="mt-4 flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[18px] border border-[var(--danger)]/20 px-4 py-3 text-sm font-semibold text-[var(--danger)]"
                            >
                              <XCircle className="h-4 w-4" />
                              {cancellingId === booking.id ? 'Cancelling...' : 'Confirm cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancelDraft({ id: null, reason: '' })}
                              className="inline-flex flex-1 items-center justify-center rounded-[18px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                            >
                              Keep booking
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCancelDraft({ id: booking.id, reason: '' })}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[var(--danger)]/20 px-4 py-3 text-sm font-semibold text-[var(--danger)]"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel booking
                        </button>
                      )
                    ) : (
                      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4 text-sm text-[var(--text-muted)]">
                        This booking has reached a final workflow state and can no longer be cancelled from the user
                        portal.
                      </div>
                    )}

                    {qrDraft.bookingId === booking.id ? (
                      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                        {qrDraft.loading ? (
                          <p className="text-sm text-[var(--text-muted)]">Generating your approved booking QR pass...</p>
                        ) : qrDraft.error ? (
                          <p className="text-sm text-[var(--danger)]">{qrDraft.error}</p>
                        ) : (
                          <div className="space-y-3">
                            <div
                              className="mx-auto w-full max-w-[220px] overflow-hidden rounded-[24px] bg-white p-3"
                              dangerouslySetInnerHTML={{ __html: qrDraft.svg }}
                            />
                            <p className="text-center text-sm leading-6 text-[var(--text-muted)]">
                              Present this pass when accessing the approved resource slot.
                            </p>
                          </div>
                        )}
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

