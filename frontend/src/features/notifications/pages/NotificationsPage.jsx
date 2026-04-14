import {
  BellRing,
  CalendarClock,
  CheckCheck,
  ExternalLink,
  MessageSquareMore,
  RefreshCw,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../../context/NotificationContext.jsx'
import { api, toApiError } from '../../../lib/api.js'
import {
  countUnreadNotifications,
  formatNotificationTimestamp,
  getNotificationCategory,
  getNotificationTypeLabel,
} from '../api/notifications.js'

const notificationIconMap = {
  BOOKING_APPROVED: CalendarClock,
  BOOKING_REJECTED: CalendarClock,
  BOOKING_CANCELLED: CalendarClock,
  TICKET_ASSIGNED: Wrench,
  TICKET_STATUS_CHANGED: Wrench,
  TICKET_COMMENT: MessageSquareMore,
}

const filterOptions = [
  { value: 'all', label: 'All activity' },
  { value: 'unread', label: 'Unread only' },
  { value: 'booking', label: 'Booking updates' },
  { value: 'ticket', label: 'Ticket updates' },
]

function NotificationMetric({ label, value }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="font-display mt-3 text-3xl font-semibold">{value}</p>
    </div>
  )
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { setUnreadCount } = useNotifications()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [busyNotificationId, setBusyNotificationId] = useState('')
  const [markingAll, setMarkingAll] = useState(false)
  const deferredSearch = useDeferredValue(search)

  const syncNotifications = (nextNotifications) => {
    setNotifications(nextNotifications)
    setUnreadCount(countUnreadNotifications(nextNotifications))
  }

  const loadNotifications = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/api/notifications')
      syncNotifications(response.data)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load notifications right now.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const metrics = useMemo(() => {
    const unread = countUnreadNotifications(notifications)
    const booking = notifications.filter((notification) => notification.type.startsWith('BOOKING_')).length

    return {
      total: notifications.length,
      unread,
      booking,
      ticket: notifications.length - booking,
    }
  }, [notifications])

  const visibleNotifications = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()

    return notifications.filter((notification) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'unread' && !notification.read) ||
        (filter === 'booking' && notification.type.startsWith('BOOKING_')) ||
        (filter === 'ticket' && !notification.type.startsWith('BOOKING_'))

      if (!matchesFilter) {
        return false
      }

      if (!query) {
        return true
      }

      return [notification.title, notification.message, getNotificationTypeLabel(notification.type)]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [deferredSearch, filter, notifications])

  const updateNotification = (notificationId, nextNotification) => {
    const nextNotifications = notifications.map((notification) =>
      notification.id === notificationId ? nextNotification : notification,
    )
    syncNotifications(nextNotifications)
    return nextNotifications
  }

  const removeNotification = (notificationId) => {
    const nextNotifications = notifications.filter((notification) => notification.id !== notificationId)
    syncNotifications(nextNotifications)
  }

  const markAsRead = async (notification, options = {}) => {
    if (notification.read) {
      return notification
    }

    setBusyNotificationId(notification.id)

    try {
      const response = await api.put(`/api/notifications/${notification.id}/read`)
      updateNotification(notification.id, response.data)

      if (!options.silent) {
        setSuccessMessage('Notification marked as read.')
      }

      return response.data
    } catch (requestError) {
      if (!options.silent) {
        setError(toApiError(requestError, 'Could not update that notification.').message)
      }
      return notification
    } finally {
      setBusyNotificationId('')
    }
  }

  const handleOpenNotification = async (notification) => {
    setError('')
    setSuccessMessage('')

    const nextNotification = await markAsRead(notification, { silent: true })
    navigate(nextNotification.link || '/notifications')
  }

  const handleDelete = async (notificationId) => {
    setBusyNotificationId(notificationId)
    setError('')
    setSuccessMessage('')

    try {
      await api.delete(`/api/notifications/${notificationId}`)
      removeNotification(notificationId)
      setSuccessMessage('Notification removed from your inbox.')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not remove that notification.').message)
    } finally {
      setBusyNotificationId('')
    }
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true)
    setError('')
    setSuccessMessage('')

    try {
      await api.put('/api/notifications/read-all')
      const nextNotifications = notifications.map((notification) =>
        notification.read
          ? notification
          : {
              ...notification,
              read: true,
              readAt: new Date().toISOString(),
            },
      )
      syncNotifications(nextNotifications)
      setSuccessMessage('All notifications have been marked as read.')
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not mark every notification as read.').message)
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Notifications
            </p>
            <h1 className="font-display mt-4 text-4xl font-semibold">
              One inbox for approvals, assignments, and ticket movement
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              Keep booking decisions, technician assignments, and ticket commentary visible without crossing role
              boundaries or losing unread state across sessions.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadNotifications}
              className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-5 py-3.5 text-sm font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh inbox
            </button>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markingAll || metrics.unread === 0}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-3.5 text-sm font-semibold disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <NotificationMetric label="Inbox items" value={metrics.total} />
        <NotificationMetric label="Unread" value={metrics.unread} />
        <NotificationMetric label="Booking updates" value={metrics.booking} />
        <NotificationMetric label="Ticket updates" value={metrics.ticket} />
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

      <section className="grid gap-3 rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your notification inbox"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === option.value
                  ? 'btn-primary'
                  : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`notifications-skeleton-${index}`}
                className="animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="h-6 w-1/3 rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] p-8 text-center">
            <BellRing className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
            <p className="font-display mt-4 text-2xl font-semibold">Your inbox is clear</p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              As bookings and tickets move through the workflow, actionable updates will appear here with their related
              deep links.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleNotifications.map((notification) => {
              const NotificationIcon = notificationIconMap[notification.type] || BellRing
              const isBusy = busyNotificationId === notification.id

              return (
                <article
                  key={notification.id}
                  className={`rounded-[28px] border p-5 transition ${
                    notification.read
                      ? 'border-[var(--border)] bg-[var(--surface)]'
                      : 'border-[var(--primary)]/20 bg-[color-mix(in_srgb,var(--primary-soft)_85%,white_15%)]'
                  }`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-strong)] text-[var(--primary)]">
                        <NotificationIcon className="h-5 w-5" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-display text-2xl font-semibold">{notification.title}</h2>
                          <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                            {getNotificationCategory(notification.type)}
                          </span>
                          {!notification.read ? (
                            <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-white">
                              Unread
                            </span>
                          ) : null}
                        </div>

                        <p className="text-sm leading-7 text-[var(--text-muted)]">{notification.message}</p>

                        <div className="flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
                          <span>{getNotificationTypeLabel(notification.type)}</span>
                          <span>{formatNotificationTimestamp(notification.createdAt)}</span>
                          {notification.readAt ? <span>Read {formatNotificationTimestamp(notification.readAt)}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full max-w-[320px] flex-col gap-3">
                      {notification.link ? (
                        <button
                          type="button"
                          onClick={() => handleOpenNotification(notification)}
                          disabled={isBusy}
                          className="btn-primary inline-flex items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-sm font-semibold disabled:opacity-60"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open related item
                        </button>
                      ) : null}

                      {!notification.read ? (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                        >
                          <CheckCheck className="h-4 w-4" />
                          Mark as read
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleDelete(notification.id)}
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--danger)]/20 px-4 py-3 text-sm font-semibold text-[var(--danger)] disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

