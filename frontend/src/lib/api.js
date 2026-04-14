import axios from 'axios'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8080'

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
})

function readCookie(name) {
  if (typeof document === 'undefined') {
    return null
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null
}

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase()
  const csrfToken = readCookie('XSRF-TOKEN')

  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(method)) {
    config.headers['X-XSRF-TOKEN'] = csrfToken
  }

  return config
})

export function toApiError(error, fallbackMessage) {
  if (error.response?.data?.message) {
    return error.response.data
  }

  return {
    code: 'REQUEST_FAILED',
    message: fallbackMessage,
    fieldErrors: {},
  }
}

export function resolveApiUrl(path) {
  if (!path) {
    return apiBaseUrl
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`
}
