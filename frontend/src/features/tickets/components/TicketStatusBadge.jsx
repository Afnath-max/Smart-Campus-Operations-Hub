import { formatTicketStatus } from '../api/tickets.js'

const toneClassNames = {
  OPEN: 'tone-info border',
  IN_PROGRESS: 'tone-warning border',
  RESOLVED: 'tone-success border',
  CLOSED: 'tone-default border',
  REJECTED: 'tone-danger border',
}

export function TicketStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClassNames[status] || toneClassNames.CLOSED}`}
    >
      {formatTicketStatus(status)}
    </span>
  )
}


