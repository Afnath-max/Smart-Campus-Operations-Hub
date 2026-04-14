const notificationDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const notificationTypeLabels = {
  BOOKING_APPROVED: 'Booking approved',
  BOOKING_REJECTED: 'Booking rejected',
  BOOKING_CANCELLED: 'Booking cancelled',
  TICKET_ASSIGNED: 'Ticket assigned',
  TICKET_STATUS_CHANGED: 'Ticket status updated',
  TICKET_COMMENT: 'New ticket comment',
}

export function countUnreadNotifications(notifications) {
  return notifications.filter((notification) => !notification.read).length
}

export function formatNotificationTimestamp(value) {
  if (!value) {
    return 'Just now'
  }

  return notificationDateTimeFormatter.format(new Date(value))
}

export function getNotificationCategory(type) {
  if (type?.startsWith('BOOKING_')) {
    return 'Booking'
  }

  return 'Ticket'
}

export function getNotificationTypeLabel(type) {
  return notificationTypeLabels[type] || 'Operational update'
}

