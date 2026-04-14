export const userRoleOptions = [
  { value: 'USER', label: 'User' },
  { value: 'TECHNICIAN', label: 'Technician' },
  { value: 'ADMIN', label: 'Admin' },
]

export const accountStatusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DISABLED', label: 'Disabled' },
]

export const authProviderOptions = [
  { value: 'LOCAL', label: 'Local only' },
  { value: 'GOOGLE', label: 'Google only' },
  { value: 'BOTH', label: 'Local + Google' },
]

export function formatInvitationStatus(status) {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
