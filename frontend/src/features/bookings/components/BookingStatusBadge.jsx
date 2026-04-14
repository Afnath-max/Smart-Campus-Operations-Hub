import { formatBookingStatus } from '../api/bookings.js'

const toneClassNames = {
  PENDING: 'tone-warning border',
  APPROVED: 'tone-success border',
  REJECTED: 'tone-danger border',
  CANCELLED: 'tone-default border',
}

export function BookingStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClassNames[status] || toneClassNames.CANCELLED}`}
    >
      {formatBookingStatus(status)}
    </span>
  )
}


