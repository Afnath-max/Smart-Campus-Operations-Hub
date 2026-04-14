import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  LocateFixed,
  Search,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, toApiError } from '../../../lib/api.js'
import { formatResourceType } from '../../resources/api/resources.js'

const emptyForm = {
  resourceId: '',
  bookingDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
  expectedAttendees: '0',
}

function validateBookingForm(form, selectedResource) {
  const errors = {}
  const attendeeCount = Number(form.expectedAttendees || 0)

  if (!form.resourceId) {
    errors.resourceId = 'Select a resource before continuing.'
  }

  if (!form.bookingDate) {
    errors.bookingDate = 'Choose the booking date.'
  }

  if (!form.startTime) {
    errors.startTime = 'Choose the booking start time.'
  }

  if (!form.endTime) {
    errors.endTime = 'Choose the booking end time.'
  }

  if (form.startTime && form.endTime && form.startTime >= form.endTime) {
    errors.timeRangeValid = 'Start time must be earlier than end time.'
  }

  if (!form.purpose.trim()) {
    errors.purpose = 'Tell the operations team what this booking supports.'
  } else if (form.purpose.trim().length > 500) {
    errors.purpose = 'Purpose must be 500 characters or fewer.'
  }

  if (Number.isNaN(attendeeCount) || attendeeCount < 0) {
    errors.expectedAttendees = 'Expected attendees must be zero or more.'
  }

  if (selectedResource && attendeeCount > selectedResource.capacity) {
    errors.expectedAttendees = `This resource supports up to ${selectedResource.capacity} attendees.`
  }

  return errors
}

export function BookingRequestPage() {
  const navigate = useNavigate()
  const [resources, setResources] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [availability, setAvailability] = useState(null)

  useEffect(() => {
    const loadResources = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/api/resources', {
          params: { status: 'ACTIVE' },
        })
        setResources(response.data)
        setForm((current) => ({
          ...current,
          resourceId: current.resourceId || response.data[0]?.id || '',
        }))
      } catch (requestError) {
        setError(toApiError(requestError, 'Could not load active resources for booking.').message)
      } finally {
        setLoading(false)
      }
    }

    loadResources()
  }, [])

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === form.resourceId) || null,
    [form.resourceId, resources],
  )

  const clearTransientState = () => {
    setAvailability(null)
    setError('')
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: '', timeRangeValid: '' }))
    clearTransientState()
  }

  const createPayload = () => ({
    ...form,
    expectedAttendees: Number(form.expectedAttendees || 0),
  })

  const handleAvailabilityCheck = async () => {
    const nextErrors = validateBookingForm(form, selectedResource)
    setFormErrors(nextErrors)
    setAvailability(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setCheckingAvailability(true)
    setError('')

    try {
      const response = await api.get('/api/bookings/check', {
        params: createPayload(),
      })
      setAvailability(response.data)
    } catch (requestError) {
      const apiError = toApiError(requestError, 'Could not verify booking availability right now.')
      setFormErrors(apiError.fieldErrors || {})
      setError(apiError.message)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateBookingForm(form, selectedResource)
    setFormErrors(nextErrors)
    setError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      await api.post('/api/bookings', createPayload())
      navigate('/bookings/my', {
        state: { message: 'Booking request submitted. It is now waiting for admin approval.' },
      })
    } catch (requestError) {
      const apiError = toApiError(requestError, 'Could not submit your booking request.')
      setFormErrors(apiError.fieldErrors || {})
      setError(apiError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-5">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Module B</p>
          <h1 className="font-display mt-4 text-4xl font-semibold">Request a campus booking</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
            Choose an active resource, confirm the attendee fit, pre-check the slot, and submit a conflict-aware
            booking request for approval.
          </p>
        </div>

        {error ? (
          <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-5 py-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
            <div className="space-y-3 animate-pulse">
              <div className="h-5 w-40 rounded-full bg-[var(--surface-muted)]" />
              <div className="h-12 w-full rounded-[20px] bg-[var(--surface-muted)]" />
              <div className="h-12 w-full rounded-[20px] bg-[var(--surface-muted)]" />
              <div className="h-28 w-full rounded-[20px] bg-[var(--surface-muted)]" />
            </div>
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <p className="font-display mt-4 text-2xl font-semibold">No active resources available</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              Once an admin activates lecture halls, labs, meeting rooms, or equipment, they will appear here for
              booking requests.
            </p>
            <Link
              to="/catalogue"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Browse the catalogue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <form className="grid gap-5 rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block space-y-2 lg:col-span-2">
                <span className="text-sm font-semibold">Active resource</span>
                <select
                  name="resourceId"
                  value={form.resourceId}
                  onChange={handleFieldChange}
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
                >
                  <option value="">Select a resource</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} • {formatResourceType(resource.type)} • Capacity {resource.capacity}
                    </option>
                  ))}
                </select>
                {formErrors.resourceId ? <p className="text-sm text-[var(--danger)]">{formErrors.resourceId}</p> : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold">Booking date</span>
                <input
                  type="date"
                  name="bookingDate"
                  value={form.bookingDate}
                  onChange={handleFieldChange}
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
                />
                {formErrors.bookingDate ? <p className="text-sm text-[var(--danger)]">{formErrors.bookingDate}</p> : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold">Expected attendees</span>
                <input
                  type="number"
                  min="0"
                  name="expectedAttendees"
                  value={form.expectedAttendees}
                  onChange={handleFieldChange}
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
                />
                {formErrors.expectedAttendees ? (
                  <p className="text-sm text-[var(--danger)]">{formErrors.expectedAttendees}</p>
                ) : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold">Start time</span>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleFieldChange}
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
                />
                {formErrors.startTime ? <p className="text-sm text-[var(--danger)]">{formErrors.startTime}</p> : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold">End time</span>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleFieldChange}
                  className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
                />
                {formErrors.endTime ? <p className="text-sm text-[var(--danger)]">{formErrors.endTime}</p> : null}
              </label>
            </div>

            {formErrors.timeRangeValid ? <p className="text-sm text-[var(--danger)]">{formErrors.timeRangeValid}</p> : null}

            <label className="block space-y-2">
              <span className="text-sm font-semibold">Purpose</span>
              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleFieldChange}
                rows="5"
                placeholder="Explain what the resource will be used for, who is attending, and any setup needs."
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              />
              {formErrors.purpose ? <p className="text-sm text-[var(--danger)]">{formErrors.purpose}</p> : null}
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAvailabilityCheck}
                disabled={checkingAvailability}
                className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-5 py-3.5 text-sm font-semibold transition hover:bg-[var(--surface-muted)] disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {checkingAvailability ? 'Checking slot...' : 'Check availability'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-3.5 text-sm font-semibold disabled:opacity-60"
              >
                <CalendarRange className="h-4 w-4" />
                {submitting ? 'Submitting request...' : 'Submit booking request'}
              </button>
            </div>
          </form>
        )}
      </section>

      <aside className="space-y-5">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          {selectedResource ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Selected resource</p>
                <h2 className="font-display text-3xl font-semibold">{selectedResource.name}</h2>
                <p className="text-sm leading-7 text-[var(--text-muted)]">
                  {selectedResource.description || 'A detailed description will appear here once admins expand the catalogue entry.'}
                </p>
              </div>

              <div className="grid gap-4 rounded-[28px] bg-[var(--surface)] p-5">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
                  <div>
                    <p className="text-sm font-semibold">Resource type</p>
                    <p className="text-sm text-[var(--text-muted)]">{formatResourceType(selectedResource.type)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <LocateFixed className="h-4 w-4 text-[var(--primary)]" />
                  <div>
                    <p className="text-sm font-semibold">Location</p>
                    <p className="text-sm text-[var(--text-muted)]">{selectedResource.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <UsersRound className="h-4 w-4 text-[var(--primary)]" />
                  <div>
                    <p className="text-sm font-semibold">Capacity</p>
                    <p className="text-sm text-[var(--text-muted)]">{selectedResource.capacity} attendees</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock3 className="h-4 w-4 text-[var(--primary)]" />
                  <div>
                    <p className="text-sm font-semibold">Availability window</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {selectedResource.availableFrom} to {selectedResource.availableTo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
              <p className="font-display text-2xl font-semibold">Choose a resource</p>
              <p className="text-sm leading-7 text-[var(--text-muted)]">
                The details panel will update with availability boundaries and capacity as soon as you select an active
                resource.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Availability pre-check</p>
          {availability ? (
            <div
              className={`mt-4 rounded-[24px] px-5 py-4 ${
                availability.available
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                  : 'bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">{availability.available ? 'Slot available' : 'Conflict detected'}</p>
                  <p className="mt-1 text-sm leading-7">{availability.message}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
              Use the pre-check once the form is filled in. The backend will still re-run the conflict and availability
              validation when the request is submitted.
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}

