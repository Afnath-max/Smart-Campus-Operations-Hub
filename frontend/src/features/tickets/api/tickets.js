export const ticketCategoryOptions = [
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'FACILITY', label: 'Facility' },
  { value: 'NETWORK', label: 'Network' },
  { value: 'OTHER', label: 'Other' },
]

export const ticketPriorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
]

export const ticketStatusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REJECTED', label: 'Rejected' },
]

const ticketStatusLabels = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
}

const ticketPriorityLabels = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export function formatTicketStatus(status) {
  return ticketStatusLabels[status] || status
}

export function formatTicketPriority(priority) {
  return ticketPriorityLabels[priority] || priority
}

export function buildTicketFormData(ticket, files = []) {
  const formData = new FormData()
  formData.append(
    'ticket',
    new Blob([JSON.stringify(ticket)], {
      type: 'application/json',
    }),
  )

  files.forEach((file) => {
    formData.append('images', file)
  })

  return formData
}

export function canTechnicianMoveToInProgress(ticket) {
  return ticket.status === 'OPEN'
}

export function canTechnicianResolve(ticket) {
  return ticket.status === 'IN_PROGRESS'
}

export function canAdminClose(ticket) {
  return ticket.status === 'RESOLVED'
}

