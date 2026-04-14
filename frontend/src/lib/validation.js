export const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/

export function isValidEmail(value) {
  return /^\S+@\S+\.\S+$/.test((value || '').trim())
}

export function isStrongPassword(value) {
  const normalized = value || ''
  return normalized.length >= 8 && strongPasswordPattern.test(normalized)
}

export function supportsLocalAuthProvider(authProviderType) {
  return authProviderType === 'LOCAL' || authProviderType === 'BOTH'
}
