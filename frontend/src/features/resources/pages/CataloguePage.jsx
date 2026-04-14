import {
  AlertTriangle,
  Clock3,
  LocateFixed,
  Search,
  Shapes,
  UsersRound,
} from 'lucide-react'
import { useDeferredValue, useEffect, useState } from 'react'
import { api, toApiError } from '../../../lib/api.js'
import {
  formatResourceType,
  resourceStatusOptions,
  resourceTypeOptions,
} from '../api/resources.js'

function ResourceBadge({ status }) {
  const isActive = status === 'ACTIVE'

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isActive
          ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
          : 'bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]'
      }`}
    >
      {status === 'ACTIVE' ? 'Active' : 'Out of service'}
    </span>
  )
}

export function CataloguePage() {
  const [filters, setFilters] = useState({
    q: '',
    type: '',
    status: '',
    minCapacity: '',
    location: '',
  })
  const [resources, setResources] = useState([])
  const [selectedResource, setSelectedResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const deferredQuery = useDeferredValue(filters.q)

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/api/resources', {
          params: {
            q: deferredQuery || undefined,
            type: filters.type || undefined,
            status: filters.status || undefined,
            minCapacity: filters.minCapacity || undefined,
            location: filters.location || undefined,
          },
        })
        setResources(response.data)
        setSelectedResource((current) =>
          response.data.find((resource) => resource.id === current?.id) || response.data[0] || null,
        )
      } catch (requestError) {
        setError(toApiError(requestError, 'Could not load the resource catalogue.').message)
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [deferredQuery, filters.location, filters.minCapacity, filters.status, filters.type])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-5">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Module A</p>
          <h1 className="font-display mt-4 text-4xl font-semibold">Campus resource catalogue</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
            Browse active and out-of-service resources, inspect availability windows, and confirm capacity before the
            booking workflow lands next.
          </p>
        </div>

        <div className="grid gap-3 rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:col-span-2">
            <Search className="h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              name="q"
              value={filters.q}
              onChange={handleFilterChange}
              placeholder="Search by name, description, or location"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>

          <select
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none"
          >
            {resourceTypeOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none"
          >
            {resourceStatusOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            name="minCapacity"
            value={filters.minCapacity}
            onChange={handleFilterChange}
            placeholder="Min capacity"
            className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none"
          />

          <input
            type="text"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
            placeholder="Location"
            className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none md:col-span-2 xl:col-span-5"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`resource-skeleton-${index}`}
                className="animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-5"
              >
                <div className="h-4 w-24 rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-4 h-6 w-3/4 rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] p-5 text-[var(--danger)]">
            {error}
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <p className="mt-4 font-display text-2xl font-semibold">No matching resources</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              Try widening the search, lowering the capacity filter, or clearing the status filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map((resource) => (
              <button
                key={resource.id}
                type="button"
                onClick={() => setSelectedResource(resource)}
                className={`rounded-[28px] border p-5 text-left transition ${
                  selectedResource?.id === resource.id
                    ? 'border-[var(--primary)] bg-[var(--surface-strong)]'
                    : 'border-[var(--border)] bg-[var(--surface-strong)] hover:border-[var(--primary)]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {formatResourceType(resource.type)}
                    </p>
                    <h2 className="font-display mt-2 text-2xl font-semibold">{resource.name}</h2>
                  </div>
                  <ResourceBadge status={resource.status} />
                </div>

                <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
                  {resource.description || 'No description provided yet.'}
                </p>

                <div className="mt-5 grid gap-3 text-sm text-[var(--text-muted)] sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <LocateFixed className="h-4 w-4" />
                    <span>{resource.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4" />
                    <span>Capacity {resource.capacity}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        {selectedResource ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--primary)]">
                  <Shapes className="h-4 w-4" />
                  {formatResourceType(selectedResource.type)}
                </span>
                <ResourceBadge status={selectedResource.status} />
              </div>
              <div>
                <h2 className="font-display text-3xl font-semibold">{selectedResource.name}</h2>
                <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">
                  {selectedResource.description || 'A detailed description will appear here as the catalogue grows.'}
                </p>
              </div>
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

            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Booking readiness
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                {selectedResource.status === 'ACTIVE'
                  ? 'This resource is ready for booking once the conflict-aware booking workflow lands in the next module.'
                  : 'This resource is out of service and will stay unavailable for new bookings until an admin reactivates it.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-4">
              <Shapes className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
              <p className="font-display text-2xl font-semibold">Select a resource</p>
              <p className="max-w-sm text-sm leading-7 text-[var(--text-muted)]">
                Pick any catalogue card to inspect capacity, status, location, and booking readiness.
              </p>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

