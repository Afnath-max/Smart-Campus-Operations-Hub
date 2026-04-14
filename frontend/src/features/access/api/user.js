export function getUserInitials(fullName = '') {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'SC'
}

export function getRoleLabel(role) {
  switch (role) {
    case 'ADMIN':
      return 'Administrator'
    case 'TECHNICIAN':
      return 'Technician'
    case 'USER':
    default:
      return 'Campus User'
  }
}

export function getAuthProviderLabel(authProviderType) {
  switch (authProviderType) {
    case 'GOOGLE':
      return 'Google only'
    case 'BOTH':
      return 'Local + Google'
    case 'LOCAL':
    default:
      return 'Local only'
  }
}

export function canLinkGoogleAccount(user) {
  return Boolean(user) && !user.googleLinked && user.authProviderType !== 'GOOGLE'
}
