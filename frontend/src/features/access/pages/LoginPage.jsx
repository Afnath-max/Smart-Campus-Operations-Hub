import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import loginOperationsIllustration from '../../../assets/login-operations-illustration.png'
import { useAuth } from '../../../context/AuthContext.jsx'
import { useTheme } from '../../../context/ThemeContext.jsx'
import { api, resolveApiUrl, toApiError } from '../../../lib/api.js'
import { isValidEmail } from '../../../lib/validation.js'
import { AlertBanner } from '../../../ui/AlertBanner.jsx'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5">
      <path
        fill="#EA4335"
        d="M12.24 10.285v3.821h5.445c-.22 1.414-1.643 4.146-5.445 4.146-3.278 0-5.95-2.717-5.95-6.071s2.672-6.071 5.95-6.071c1.865 0 3.114.794 3.829 1.48l2.613-2.538C16.99 3.47 14.842 2.5 12.24 2.5 6.95 2.5 2.667 6.806 2.667 12.18s4.283 9.68 9.573 9.68c5.525 0 9.191-3.881 9.191-9.346 0-.628-.068-1.107-.151-1.581z"
      />
      <path
        fill="#34A853"
        d="M2.667 7.462 5.804 9.76c.848-2.586 3.268-4.438 6.436-4.438 1.865 0 3.114.794 3.829 1.48l2.613-2.538C16.99 3.47 14.842 2.5 12.24 2.5 8.562 2.5 5.37 4.618 3.828 7.712z"
      />
      <path
        fill="#FBBC05"
        d="M2.667 16.899 5.804 14.6c.396 1.208 1.128 2.272 2.087 3.021l-3.31 2.567c-1.332-1.222-2.298-2.855-2.914-4.649z"
      />
      <path
        fill="#4285F4"
        d="M12.24 21.86c2.602 0 4.78-.861 6.373-2.345l-3.106-2.551c-.833.587-1.945.999-3.267.999-3.15 0-5.562-1.838-6.417-4.408l-3.155 2.437c1.532 3.087 4.755 5.868 9.572 5.868z"
      />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const { resolvedTheme } = useTheme()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const darkPanel = resolvedTheme === 'dark'

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.email.trim()) {
      nextErrors.email = 'Enter your campus email address.'
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!form.password.trim()) {
      nextErrors.password = 'Enter your password.'
    }
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setSubmitError('')

    if (Object.keys(nextErrors).length) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await login(form)
      navigate(location.state?.from || response.redirectTo, { replace: true })
    } catch (error) {
      const apiError = toApiError(error, 'Unable to sign you in right now.')
      setErrors(apiError.fieldErrors || {})
      setSubmitError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setSubmitError('')
    setIsGoogleSubmitting(true)
    try {
      const response = await api.get('/api/auth/google/authorization-url')
      window.location.assign(resolveApiUrl(response.data.authorizationUrl))
    } catch (error) {
      const apiError = toApiError(error, 'Google sign-in is unavailable right now.')
      setSubmitError(
        apiError.code === 'GOOGLE_AUTH_NOT_CONFIGURED'
          ? 'Google sign-in is not configured yet. Add your Google client ID and secret to backend/.env.'
          : apiError.message,
      )
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <div className="panel mx-auto grid min-h-[calc(100vh-9.5rem)] max-w-[1440px] overflow-hidden rounded-[36px] lg:min-h-[calc(100vh-11rem)] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex items-center bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,transparent),color-mix(in_srgb,var(--surface-soft)_42%,var(--surface)))] px-6 pt-8 pb-6 sm:px-10 lg:items-start lg:px-16 lg:pt-14 lg:pb-5">
        <div className="mx-auto w-full max-w-[35rem] space-y-8">
          <div className="space-y-4 text-center">
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                <ShieldCheck className="h-4 w-4" />
                Shared login
              </span>
            </div>
            <div>
              <h1 className="font-display text-5xl font-semibold tracking-tight text-[var(--heading-color)] sm:text-6xl">
                Login
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[var(--muted-text)]">
                Access your verified Smart Campus account securely.
              </p>
            </div>
          </div>

          {submitError ? (
            <AlertBanner onClose={() => setSubmitError('')}>
              {submitError}
            </AlertBanner>
          ) : null}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || isGoogleSubmitting}
            className="group flex w-full items-center justify-center gap-3 rounded-[22px] border border-[color-mix(in_srgb,var(--border)_88%,white_12%)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_97%,transparent),color-mix(in_srgb,var(--surface-soft)_44%,var(--surface)))] px-5 py-4 text-sm font-semibold text-[var(--heading-color)] shadow-[var(--shadow)] transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--primary)_26%,var(--border))] hover:shadow-[0_18px_42px_rgba(37,99,235,0.12)] disabled:translate-y-0 disabled:opacity-60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--border)_82%,white_18%)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,white_2%),color-mix(in_srgb,var(--surface-soft)_55%,var(--surface)))] shadow-[var(--surface-highlight)] transition group-hover:scale-105">
              <GoogleMark />
            </span>
            <span className="tracking-[0.01em]">
              {isGoogleSubmitting ? 'Opening Google...' : 'Continue with Google'}
            </span>
          </button>

          <div className="flex items-center gap-3 text-sm text-[var(--muted-text)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span>or use your email</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <label className="block space-y-3">
              <span className="text-sm font-semibold text-[var(--heading-color)]">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-[var(--text)] outline-none transition"
                placeholder="name@campus.edu"
              />
              {errors.email ? <p className="text-sm text-[var(--danger-foreground)]">{errors.email}</p> : null}
            </label>

            <label className="block space-y-3">
              <span className="flex items-center justify-between gap-4 text-sm font-semibold text-[var(--heading-color)]">
                <span>Password</span>
                <span className="text-xs font-medium text-[var(--muted-text)]">Campus-secured access</span>
              </span>
              <div className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-5">
                <LockKeyhole className="h-4 w-4 text-[var(--muted-text)]" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border-none bg-transparent py-4 text-[var(--text)] shadow-none outline-none"
                  placeholder="Enter your password"
                />
              </div>
              {errors.password ? <p className="text-sm text-[var(--danger-foreground)]">{errors.password}</p> : null}
            </label>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-[24px] px-5 py-4 text-sm font-semibold disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-center text-base text-[var(--muted-text)]">
            Don&apos;t have a user account?{' '}
            <Link to="/register" className="font-semibold text-[var(--primary)] hover:text-[var(--button-primary-end)]">
              Create your account
            </Link>
          </p>
        </div>
      </section>

      <section
        className={`relative hidden overflow-hidden px-10 pt-10 pb-6 lg:flex lg:pt-14 lg:pb-5 ${
          darkPanel
            ? 'border-l border-[rgba(72,97,145,0.34)] bg-[linear-gradient(180deg,#1f2759_0%,#202857_100%)]'
            : 'border-l border-[rgba(203,213,225,0.92)] bg-[linear-gradient(180deg,#f7fbff_0%,#eef4ff_100%)]'
        }`}
      >
        <div
          className={`absolute inset-0 ${
            darkPanel
              ? 'bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_34%)]'
              : 'bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_36%)]'
          }`}
        />
        <div
          className={`absolute inset-0 ${
            darkPanel
              ? 'bg-[radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.12),transparent_32%)]'
              : 'bg-[radial-gradient(circle_at_bottom_right,rgba(125,211,252,0.16),transparent_30%)]'
          }`}
        />
        <div
          className={`absolute inset-0 ${
            darkPanel
              ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
              : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]'
          }`}
        />
        <div className="relative flex flex-col gap-1 lg:pt-3">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(145deg,#60a5fa_0%,#2dd4bf_100%)] text-white shadow-[var(--interactive-glow)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className={`text-2xl font-semibold tracking-tight ${darkPanel ? 'text-white' : 'text-[#0f172a]'}`}>
                  Smart Campus
                </p>
                <p className={`text-base ${darkPanel ? 'text-slate-300' : 'text-[#64748b]'}`}>
                  All your campus operations in one place
                </p>
              </div>
            </div>

            <h2
              className={`font-display max-w-3xl text-[2.15rem] font-semibold leading-[1.12] xl:text-[2.35rem] ${
                darkPanel ? 'text-white' : 'text-[#0f172a]'
              }`}
            >
              Track Campus Operations Securely
            </h2>
          </div>

          <figure className="relative flex justify-center -mt-12 pt-0">
            <div
              className={`absolute inset-x-8 bottom-1 h-24 rounded-full blur-3xl ${
                darkPanel
                  ? 'bg-[radial-gradient(circle,rgba(96,165,250,0.2),transparent_65%)]'
                  : 'bg-[radial-gradient(circle,rgba(96,165,250,0.12),transparent_68%)]'
              }`}
            />
            <img
              src={loginOperationsIllustration}
              alt="Smart campus operations dashboard with secure sign-in, notifications, maintenance tools, and identity verification"
              className={`relative mx-auto w-full max-w-[700px] object-contain ${
                darkPanel
                  ? 'drop-shadow-[0_36px_90px_rgba(7,13,33,0.24)]'
                  : 'drop-shadow-[0_26px_60px_rgba(96,165,250,0.16)]'
              }`}
            />
          </figure>
        </div>
      </section>
    </div>
  )
}

