import {
  AlertTriangle,
  ArrowRight,
  ImagePlus,
  LocateFixed,
  Mail,
  Paperclip,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, toApiError } from '../../../lib/api.js'
import { formatResourceType } from '../../resources/api/resources.js'
import { buildTicketFormData, ticketCategoryOptions, ticketPriorityOptions } from '../api/tickets.js'

const emptyForm = {
  resourceId: '',
  category: 'EQUIPMENT',
  priority: 'MEDIUM',
  preferredContact: '',
  description: '',
}

function validateTicketForm(form, files, imageError) {
  const errors = {}

  if (!form.category) {
    errors.category = 'Choose the ticket category.'
  }

  if (!form.priority) {
    errors.priority = 'Choose the ticket priority.'
  }

  if (!form.preferredContact.trim()) {
    errors.preferredContact = 'Provide a preferred contact channel.'
  } else if (form.preferredContact.trim().length > 160) {
    errors.preferredContact = 'Preferred contact must be 160 characters or fewer.'
  }

  if (form.description.trim().length < 20) {
    errors.description = 'Describe the issue in at least 20 characters so the technician has enough context.'
  } else if (form.description.trim().length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer.'
  }

  if (imageError) {
    errors.images = imageError
  } else if (files.length > 3) {
    errors.images = 'You can upload up to 3 images.'
  }

  return errors
}

export function TicketNewPage() {
  const navigate = useNavigate()
  const [resources, setResources] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [imageError, setImageError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    const loadResources = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/api/resources')
        setResources(response.data)
      } catch (requestError) {
        setError(toApiError(requestError, 'Could not load resources for ticket linking.').message)
      } finally {
        setLoading(false)
      }
    }

    loadResources()
  }, [])

  const previews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        name: file.name,
        url: typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '',
      })),
    [selectedFiles],
  )

  useEffect(
    () => () => {
      previews.forEach((preview) => {
        if (preview.url && typeof URL.revokeObjectURL === 'function') {
          URL.revokeObjectURL(preview.url)
        }
      })
    },
    [previews],
  )

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === form.resourceId) || null,
    [form.resourceId, resources],
  )

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: '' }))
    setError('')
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 3) {
      setSelectedFiles([])
      setImageError('You can upload up to 3 images.')
      setFormErrors((current) => ({ ...current, images: 'You can upload up to 3 images.' }))
      return
    }

    if (files.some((file) => !file.type?.startsWith('image/'))) {
      setSelectedFiles([])
      setImageError('Only image uploads are allowed.')
      setFormErrors((current) => ({ ...current, images: 'Only image uploads are allowed.' }))
      return
    }

    setSelectedFiles(files)
    setImageError('')
    setFormErrors((current) => ({ ...current, images: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateTicketForm(form, selectedFiles, imageError)
    setFormErrors(nextErrors)
    setError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        ...form,
        resourceId: form.resourceId || null,
      }
      await api.post('/api/tickets', buildTicketFormData(payload, selectedFiles))
      navigate('/tickets/my', {
        state: { message: 'Ticket submitted successfully. The operations team can now triage it.' },
      })
    } catch (requestError) {
      const apiError = toApiError(requestError, 'Could not submit your ticket.')
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
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Module C</p>
          <h1 className="font-display mt-4 text-4xl font-semibold">Report a maintenance or incident ticket</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
            Capture the problem clearly, attach up to three images, and route the issue into the technician workflow
            with the right severity and contact information.
          </p>
        </div>

        {error ? (
          <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-5 py-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <form className="grid gap-5 rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block space-y-2 lg:col-span-2">
              <span className="text-sm font-semibold">Linked resource</span>
              <select
                name="resourceId"
                value={form.resourceId}
                onChange={handleFieldChange}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              >
                <option value="">No linked resource</option>
                {resources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} • {formatResourceType(resource.type)} • {resource.location}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">Category</span>
              <select
                name="category"
                value={form.category}
                onChange={handleFieldChange}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              >
                {ticketCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">Priority</span>
              <select
                name="priority"
                value={form.priority}
                onChange={handleFieldChange}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              >
                {ticketPriorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Preferred contact</span>
            <input
              type="text"
              name="preferredContact"
              value={form.preferredContact}
              onChange={handleFieldChange}
              placeholder="user@campus.edu / ext 145"
              className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
            />
            {formErrors.preferredContact ? (
              <p className="text-sm text-[var(--danger)]">{formErrors.preferredContact}</p>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Issue description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFieldChange}
              rows="6"
              placeholder="Describe what happened, where it happened, what you observed, and anything that helps the technician reproduce the issue."
              className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
            />
            {formErrors.description ? <p className="text-sm text-[var(--danger)]">{formErrors.description}</p> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Images</span>
            <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <ImagePlus className="h-5 w-5 text-[var(--primary)]" />
                  <p className="text-sm text-[var(--text-muted)]">Upload up to 3 images to help triage the issue faster.</p>
                </div>
                <input type="file" accept="image/*" multiple onChange={handleFileChange} aria-label="Ticket images" />
              </div>

              {previews.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {previews.map((preview) => (
                    <div key={preview.name} className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface-strong)]">
                      {preview.url ? (
                        <img src={preview.url} alt={preview.name} className="h-32 w-full object-cover" />
                      ) : (
                        <div className="flex h-32 items-center justify-center bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]">
                          Preview unavailable
                        </div>
                      )}
                      <div className="px-3 py-2 text-xs text-[var(--text-muted)]">{preview.name}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {formErrors.images || imageError ? (
              <p className="text-sm text-[var(--danger)]">{formErrors.images || imageError}</p>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={submitting}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-3.5 text-sm font-semibold disabled:opacity-60"
          >
            <Paperclip className="h-4 w-4" />
            {submitting ? 'Submitting ticket...' : 'Submit ticket'}
          </button>
        </form>
      </section>

      <aside className="space-y-5">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-5 w-40 rounded-full bg-[var(--surface-muted)]" />
              <div className="h-20 w-full rounded-[24px] bg-[var(--surface-muted)]" />
            </div>
          ) : selectedResource ? (
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Linked resource summary</p>
                <h2 className="font-display text-3xl font-semibold">{selectedResource.name}</h2>
                <p className="text-sm leading-7 text-[var(--text-muted)]">
                  {selectedResource.description || 'This resource has no extended description yet.'}
                </p>
              </div>

              <div className="grid gap-4 rounded-[28px] bg-[var(--surface)] p-5">
                <div className="flex items-center gap-3">
                  <LocateFixed className="h-4 w-4 text-[var(--primary)]" />
                  <div>
                    <p className="text-sm font-semibold">Location</p>
                    <p className="text-sm text-[var(--text-muted)]">{selectedResource.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wrench className="h-4 w-4 text-[var(--primary)]" />
                  <div>
                    <p className="text-sm font-semibold">Resource type</p>
                    <p className="text-sm text-[var(--text-muted)]">{formatResourceType(selectedResource.type)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[var(--primary)]" />
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
            <div className="space-y-4">
              <AlertTriangle className="h-10 w-10 text-[var(--text-muted)]" />
              <p className="font-display text-2xl font-semibold">Resource linking is optional</p>
              <p className="text-sm leading-7 text-[var(--text-muted)]">
                Choose a resource when the issue is tied to a room, lab, or asset. Leave it blank for broader network
                or general operations incidents.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Before you submit</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-muted)]">
            <li>Describe what failed, where it happened, and when you first noticed it.</li>
            <li>Attach photos only when they add context for diagnosis or safety.</li>
            <li>Use the catalogue if you need to cross-check a resource before opening the ticket.</li>
          </ul>
          <Link to="/catalogue" className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold">
            Open catalogue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </aside>
    </div>
  )
}

