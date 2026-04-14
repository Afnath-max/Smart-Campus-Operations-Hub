import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { getDashboardPath } from '../../../lib/routes.js'
import { AlertBanner } from '../../../ui/AlertBanner.jsx'
import { LoadingScreen } from '../../../ui/LoadingScreen.jsx'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuth()
  const [searchParams] = useSearchParams()
  const [errorMessage, setErrorMessage] = useState('')
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    const status = searchParams.get('status')
    const message = searchParams.get('message')

    if (status === 'error') {
      setErrorMessage(message || 'Google sign-in could not be completed.')
      setShowError(true)
      return
    }

    const syncSession = async () => {
      const user = await refreshSession()
      if (user) {
        navigate(getDashboardPath(user.role), { replace: true })
      } else {
        setErrorMessage('Google sign-in completed, but the session could not be loaded.')
        setShowError(true)
      }
    }

    syncSession()
  }, [navigate, refreshSession, searchParams])

  if (!errorMessage) {
    return <LoadingScreen label="Finalizing your Google sign-in..." />
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="panel w-full max-w-lg rounded-[32px] px-8 py-10">
        <h1 className="font-display text-3xl font-semibold">Google sign-in needs attention</h1>
        {showError ? (
          <AlertBanner className="mt-5" onClose={() => setShowError(false)}>
            {errorMessage}
          </AlertBanner>
        ) : null}
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="btn-primary mt-8 rounded-[20px] px-5 py-3 text-sm font-semibold"
        >
          Return to login
        </button>
      </div>
    </div>
  )
}

