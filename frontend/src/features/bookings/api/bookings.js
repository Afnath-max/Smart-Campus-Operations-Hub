export const bookingStatusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const bookingStatusLabels = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export function formatBookingStatus(status) {
  return bookingStatusLabels[status] || status
}

export function formatBookingDate(bookingDate) {
  if (!bookingDate) {
    return 'Date not set'
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(`${bookingDate}T00:00:00`),
  )
}

export function formatBookingTime(time) {
  if (!time) {
    return ''
  }

  const [hours, minutes] = time.split(':')
  const value = new Date()
  value.setHours(Number(hours), Number(minutes), 0, 0)
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

export function formatBookingWindow(bookingDate, startTime, endTime) {
  return `${formatBookingDate(bookingDate)} • ${formatBookingTime(startTime)} - ${formatBookingTime(endTime)}`
}

export function canUserCancelBooking(status) {
  return status === 'PENDING' || status === 'APPROVED'
}

export function canAdminApproveBooking(status) {
  return status === 'PENDING'
}

export function canAdminRejectBooking(status) {
  return status === 'PENDING'
}

export function canAdminCancelBooking(status) {
  return status === 'PENDING' || status === 'APPROVED'
}

