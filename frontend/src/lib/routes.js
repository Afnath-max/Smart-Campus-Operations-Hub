export const APP_HOME_PATH = '/'

export function getDashboardPath(role) {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'TECHNICIAN':
      return '/technician/dashboard'
    case 'USER':
    default:
      return '/dashboard'
  }
}
