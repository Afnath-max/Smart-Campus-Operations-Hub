import { Copy, MailPlus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api, toApiError } from '../../../lib/api.js'
import { authProviderOptions, formatInvitationStatus } from '../api/adminUsers.js'
import { isValidEmail, supportsLocalAuthProvider } from '../../../lib/validation.js'

const blankForm = {
  role: 'TECHNICIAN',
  email: '',
  campusId: '',
  fullName: '',
  authProviderType: 'LOCAL',
  initialPassword: '',
}

export function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState([])
  const [form, setForm] = useState(blankForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [busyInvitationId, setBusyInvitationId] = useState('')
  const [formErrors, setFormErrors] = useState({})

  const loadInvitations = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/api/admin/invitations')
      setInvitations(response.data)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load invitations.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [])

  const pendingInvitations = useMemo(
    () => invitations.filter((invitation) => invitation.invitationStatus === 'PENDING').length,
    [invitations],
  )

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
    setFormErrors((current) => ({ ...current, [name]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!isValidEmail(form.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (form.campusId.trim().length < 3) {
      nextErrors.campusId = 'Campus ID must contain at least 3 characters.'
    } else if (form.campusId.trim().length > 40) {
      nextErrors.campusId = 'Campus ID must be 40 characters or fewer.'
    }

    if (form.fullName.trim().length < 3) {
      nextErrors.fullName = 'Enter the invitee full name.'
    } else if (form.fullName.trim().length > 120) {
      nextErrors.fullName = 'Full name must be 120 characters or fewer.'
    }

    if (supportsLocalAuthProvider(form.authProviderType) && form.initialPassword.trim().length < 8) {
      nextErrors.initialPassword = 'A password with at least 8 characters is required for local sign-in.'
    }

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateForm()
    setFormErrors(nextErrors)
    setError('')
    setSuccessMessage('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSaving(true)

    try {
      const endpoint = form.role === 'ADMIN' ? '/api/admin/users/invite-admin' : '/api/admin/users/invite-technician'
      await api.post(endpoint, {
        email: form.email,
        campusId: form.campusId,
        fullName: form.fullName,
        authProviderType: form.authProviderType,
        initialPassword: form.authProviderType === 'GOOGLE' ? null : form.initialPassword,
      })
      setForm(blankForm)
      setFormErrors({})
      setSuccessMessage('Invitation created successfully.')
      await loadInvitations()
    } catch (requestError) {
      const apiError = toApiError(requestError, 'Could not create that invitation.')
      setFormErrors(apiError.fieldErrors || {})
      setError(apiError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (invitationId) => {
    setBusyInvitationId(invitationId)
    setError('')
    setSuccessMessage('')

    try {
      await api.delete(`/api/admin/invitations/${invitationId}`)
      setInvitations((current) => current.filter((invitation) => invitation.id !== invitationId))
      setSuccessMessage('Invitation removed successfully.')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not delete that invitation.').message)
    } finally {
      setBusyInvitationId('')
    }
  }

  const copyInviteUrl = async (inviteUrl) => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setSuccessMessage('Invite URL copied to clipboard.')
    } catch {
      setError('Clipboard access was not available. You can copy the invite URL manually.')
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <aside className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Admin invitations</p>
          <h1 className="font-display mt-4 text-4xl font-semibold">Invite technician and admin accounts safely</h1>
          <p className="mt-4 text-base leading-8 text-[var(--text-muted)]">
            Pre-create privileged accounts, choose allowed auth providers, and share invite URLs without allowing role
            self-selection.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Invited role</span>
            <select
              name="role"
              value={form.role}
              onChange={handleFormChange}
              className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
            >
              <option value="TECHNICIAN">Technician</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          {[
            { name: 'fullName', label: 'Full name', placeholder: 'Facilities Operations Lead' },
            { name: 'email', label: 'Email', placeholder: 'lead@campus.edu', type: 'email' },
            { name: 'campusId', label: 'Campus ID', placeholder: 'ops1001' },
          ].map((field) => (
            <label key={field.name} className="grid gap-2">
              <span className="text-sm font-semibold">{field.label}</span>
              <input
                type={field.type || 'text'}
                name={field.name}
                value={form[field.name]}
                onChange={handleFormChange}
                placeholder={field.placeholder}
                className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              />
              {formErrors[field.name] ? <p className="text-sm text-[var(--danger)]">{formErrors[field.name]}</p> : null}
            </label>
          ))}

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Auth provider</span>
            <select
              name="authProviderType"
              value={form.authProviderType}
              onChange={handleFormChange}
              className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
            >
              {authProviderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {form.authProviderType !== 'GOOGLE' ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold">Initial password</span>
              <input
                type="password"
                name="initialPassword"
                value={form.initialPassword}
                onChange={handleFormChange}
                placeholder="Temporary password for local sign-in"
                className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              />
              {formErrors.initialPassword ? (
                <p className="text-sm text-[var(--danger)]">{formErrors.initialPassword}</p>
              ) : null}
            </label>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-3.5 text-sm font-semibold disabled:opacity-60"
          >
            <MailPlus className="h-4 w-4" />
            {saving ? 'Creating invitation...' : 'Create invitation'}
          </button>
        </form>
      </aside>

      <section className="space-y-5">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-2xl font-semibold">Invitation queue</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {pendingInvitations} pending invitations tracked in the system
              </p>
            </div>
            <button
              type="button"
              onClick={loadInvitations}
              className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-5 py-3.5 text-sm font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh invitations
            </button>
          </div>
        </div>

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

        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`admin-invitation-skeleton-${index}`}
                  className="animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <div className="h-6 w-1/3 rounded-full bg-[var(--surface-muted)]" />
                  <div className="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
                </div>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-muted)]">
              No invitations have been created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <article key={invitation.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display text-2xl font-semibold">{invitation.inviteeEmail}</h2>
                        <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                          {invitation.invitedRole}
                        </span>
                        <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                          {formatInvitationStatus(invitation.invitationStatus)}
                        </span>
                      </div>

                      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-muted)]">
                        <p><span className="font-semibold text-[var(--text)]">Invite token:</span> {invitation.inviteToken}</p>
                        <p className="mt-2 break-all"><span className="font-semibold text-[var(--text)]">Invite URL:</span> {invitation.inviteUrl}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
                        <span>Expires {new Date(invitation.expiresAt).toLocaleString()}</span>
                        <span>Created {new Date(invitation.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex w-full max-w-[320px] flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => copyInviteUrl(invitation.inviteUrl)}
                        className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                      >
                        <Copy className="h-4 w-4" />
                        Copy invite URL
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(invitation.id)}
                        disabled={busyInvitationId === invitation.id}
                        className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--danger)]/20 px-4 py-3 text-sm font-semibold text-[var(--danger)] disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete invitation
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

