import { BellRing, RotateCcw, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api, toApiError } from '../../../lib/api.js'

const preferenceFields = [
  {
    key: 'bookingUpdatesEnabled',
    title: 'Booking decisions',
    description: 'Receive approval, rejection, and administrator cancellation updates for your bookings.',
  },
  {
    key: 'ticketAssignmentEnabled',
    title: 'Ticket assignments',
    description: 'Get notified when a technician is assigned to the ticket workflow that involves you.',
  },
  {
    key: 'ticketStatusEnabled',
    title: 'Ticket status changes',
    description: 'Keep ticket progress visible as work moves from open to resolution or closure.',
  },
  {
    key: 'ticketCommentEnabled',
    title: 'Ticket comments',
    description: 'Control whether new discussion on your tickets creates inbox activity.',
  },
]

function PreferenceCard({ checked, description, id, onChange, title }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer flex-col justify-between rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{description}</p>
          </div>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              checked
                ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                : 'bg-[var(--surface-strong)] text-[var(--text-muted)]'
            }`}
          >
            {checked ? 'Enabled' : 'Muted'}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="text-sm font-semibold">Allow notification</span>
        <span className="relative inline-flex h-7 w-12 items-center">
          <input id={id} type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
          <span className="absolute inset-0 rounded-full bg-[var(--surface-muted)] transition peer-checked:bg-[var(--primary)]" />
          <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
        </span>
      </div>
    </label>
  )
}

export function NotificationSettingsPage() {
  const [form, setForm] = useState(null)
  const [savedPreferences, setSavedPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadPreferences = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/api/preferences/notifications')
      setForm(response.data)
      setSavedPreferences(response.data)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load notification preferences.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPreferences()
  }, [])

  const isDirty = useMemo(() => {
    if (!form || !savedPreferences) {
      return false
    }

    return preferenceFields.some(({ key }) => form[key] !== savedPreferences[key])
  }, [form, savedPreferences])

  const handleToggle = (key) => {
    setForm((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await api.put('/api/preferences/notifications', form)
      setForm(response.data)
      setSavedPreferences(response.data)
      setSuccessMessage('Notification preferences saved.')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not save your notification preferences.').message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setForm(savedPreferences)
    setSuccessMessage('')
    setError('')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Alert settings
            </p>
            <h1 className="font-display mt-4 text-4xl font-semibold">Tune signal, not noise</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              Keep meaningful operational changes visible while muting update types that do not need a personal inbox
              interruption.
            </p>
          </div>

          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--text-muted)]">
            Changes persist per account and apply to notification generation on the backend.
          </div>
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

      {loading || !form ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`notification-preference-skeleton-${index}`}
              className="animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-5"
            >
              <div className="h-7 w-2/5 rounded-full bg-[var(--surface-muted)]" />
              <div className="mt-4 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
              <div className="mt-2 h-4 w-4/5 rounded-full bg-[var(--surface-muted)]" />
            </div>
          ))}
        </section>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            {preferenceFields.map((field) => (
              <PreferenceCard
                key={field.key}
                id={field.key}
                title={field.title}
                description={field.description}
                checked={form[field.key]}
                onChange={() => handleToggle(field.key)}
              />
            ))}
          </section>

          <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Preference summary</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                    {preferenceFields.filter((field) => form[field.key]).length} of {preferenceFields.length} alert
                    groups are currently enabled.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!isDirty}
                  className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-5 py-3.5 text-sm font-semibold disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset changes
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-3.5 text-sm font-semibold disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save preferences'}
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

