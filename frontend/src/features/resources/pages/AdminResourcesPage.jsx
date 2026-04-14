import {
  AlertTriangle,
  PencilLine,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, toApiError } from '../../../lib/api.js'
import {
  formatResourceType,
  resourceStatusOptions,
  resourceTypeOptions,
} from '../api/resources.js'

const blankForm = {
  name: '',
  type: 'LECTURE_HALL',
  description: '',
  capacity: 1,
  location: '',
  availableFrom: '08:00',
  availableTo: '18:00',
  status: 'ACTIVE',
}

function validateResourceForm(form) {
  const nextErrors = {}

  if (form.name.trim().length < 3) {
    nextErrors.name = 'Resource name must contain at least 3 characters.'
  } else if (form.name.trim().length > 100) {
    nextErrors.name = 'Resource name must be 100 characters or fewer.'
  }

  if (!Number.isFinite(Number(form.capacity)) || Number(form.capacity) < 1) {
    nextErrors.capacity = 'Capacity must be at least 1.'
  }

  if (!form.location.trim()) {
    nextErrors.location = 'Location is required.'
  } else if (form.location.trim().length > 160) {
    nextErrors.location = 'Location must be 160 characters or fewer.'
  }

  if (form.description.trim().length > 1000) {
    nextErrors.description = 'Description must be 1000 characters or fewer.'
  }

  if (!form.availableFrom || !form.availableTo || form.availableFrom >= form.availableTo) {
    nextErrors.availabilityWindowValid = 'Available from must be earlier than available to.'
  }

  return nextErrors
}

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold"
    >
      {resourceStatusOptions
        .filter((option) => option.value)
        .map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
    </select>
  )
}

export function AdminResourcesPage() {
  const [resources, setResources] = useState([])
  const [form, setForm] = useState(blankForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  const loadResources = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/resources')
      setResources(response.data)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load resources right now.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: name === 'capacity' ? Number(value) : value }))
    setFormErrors((current) => ({ ...current, [name]: '' }))
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(blankForm)
    setFormErrors({})
  }

  const handleEdit = (resource) => {
    setEditingId(resource.id)
    setForm({
      name: resource.name,
      type: resource.type,
      description: resource.description || '',
      capacity: resource.capacity,
      location: resource.location,
      availableFrom: resource.availableFrom.slice(0, 5),
      availableTo: resource.availableTo.slice(0, 5),
      status: resource.status,
    })
    setSuccessMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateResourceForm(form)
    setFormErrors(nextErrors)
    setError('')
    setSuccessMessage('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSaving(true)

    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
      }

      if (editingId) {
        await api.put(`/api/admin/resources/${editingId}`, payload)
        setSuccessMessage('Resource updated successfully.')
      } else {
        await api.post('/api/admin/resources', payload)
        setSuccessMessage('Resource created successfully.')
      }

      resetForm()
      await loadResources()
    } catch (requestError) {
      const apiError = toApiError(requestError, 'Could not save this resource.')
      setFormErrors(apiError.fieldErrors || {})
      setError(apiError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (resourceId) => {
    setError('')
    try {
      await api.delete(`/api/admin/resources/${resourceId}`)
      if (editingId === resourceId) {
        resetForm()
      }
      await loadResources()
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not delete this resource.').message)
    }
  }

  const handleStatusChange = async (resourceId, status) => {
    setError('')
    try {
      await api.patch(`/api/admin/resources/${resourceId}/status`, { status })
      await loadResources()
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not update resource status.').message)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-5">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Admin resources</p>
          <h1 className="font-display mt-4 text-4xl font-semibold">Resource operations workspace</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
            Create, update, deactivate, and retire campus resources before the booking workflow starts enforcing
            availability and conflict rules on them.
          </p>
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-semibold">Current catalogue</p>
              <p className="text-sm text-[var(--text-muted)]">{resources.length} resources tracked</p>
            </div>
            <button
              type="button"
              onClick={loadResources}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`admin-resource-skeleton-${index}`}
                  className="animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <div className="h-5 w-2/5 rounded-full bg-[var(--surface-muted)]" />
                  <div className="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
                </div>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[var(--border)] p-8 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
              <p className="mt-4 font-display text-2xl font-semibold">No resources yet</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                Use the form to add the first lecture hall, lab, meeting room, or equipment resource.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((resource) => (
                <article
                  key={resource.id}
                  className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display text-2xl font-semibold">{resource.name}</h2>
                        <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                          {formatResourceType(resource.type)}
                        </span>
                      </div>
                      <p className="text-sm leading-7 text-[var(--text-muted)]">
                        {resource.description || 'No description yet.'}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
                        <span>{resource.location}</span>
                        <span>Capacity {resource.capacity}</span>
                        <span>
                          {resource.availableFrom} - {resource.availableTo}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusSelect
                        value={resource.status}
                        onChange={(event) => handleStatusChange(resource.id, event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleEdit(resource)}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                      >
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(resource.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--danger)]/20 px-4 py-2 text-sm font-semibold text-[var(--danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-semibold">
              {editingId ? 'Edit resource' : 'Create resource'}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              {editingId ? 'Update resource details and status.' : 'Add a catalogue item with valid availability windows.'}
            </p>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              New
            </button>
          ) : null}
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {[
            { label: 'Resource name', name: 'name', type: 'text', placeholder: 'Quantum Computing Lab' },
            { label: 'Location', name: 'location', type: 'text', placeholder: 'Engineering Block, Floor 2' },
          ].map((field) => (
            <label key={field.name} className="block space-y-2">
              <span className="text-sm font-semibold">{field.label}</span>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleFormChange}
                placeholder={field.placeholder}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              />
              {formErrors[field.name] ? <p className="text-sm text-[var(--danger)]">{formErrors[field.name]}</p> : null}
            </label>
          ))}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Type</span>
              <select
                name="type"
                value={form.type}
                onChange={handleFormChange}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              >
                {resourceTypeOptions
                  .filter((option) => option.value)
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">Capacity</span>
              <input
                type="number"
                min="1"
                name="capacity"
                value={form.capacity}
                onChange={handleFormChange}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              />
              {formErrors.capacity ? <p className="text-sm text-[var(--danger)]">{formErrors.capacity}</p> : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Available from</span>
              <input
                type="time"
                name="availableFrom"
                value={form.availableFrom}
                onChange={handleFormChange}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Available to</span>
              <input
                type="time"
                name="availableTo"
                value={form.availableTo}
                onChange={handleFormChange}
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
              />
            </label>
          </div>

          {formErrors.availabilityWindowValid ? (
            <p className="text-sm text-[var(--danger)]">{formErrors.availabilityWindowValid}</p>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Status</span>
            <select
              name="status"
              value={form.status}
              onChange={handleFormChange}
              className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
            >
              {resourceStatusOptions
                .filter((option) => option.value)
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                rows="5"
                className="w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none"
                placeholder="Describe what this resource is best suited for."
              />
              {formErrors.description ? <p className="text-sm text-[var(--danger)]">{formErrors.description}</p> : null}
            </label>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-3.5 text-sm font-semibold disabled:opacity-60"
          >
            {editingId ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Saving...' : editingId ? 'Update resource' : 'Create resource'}
          </button>
        </form>
      </aside>
    </div>
  )
}

