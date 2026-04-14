import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { toApiError } from '../../../lib/api.js'
import { isStrongPassword, isValidEmail } from '../../../lib/validation.js'
import { AlertBanner } from '../../../ui/AlertBanner.jsx'

const initialForm = {
  campusId: '',
  fullName: '',
  email: '',
  password: '',
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (form.campusId.trim().length < 3) {
      nextErrors.campusId = 'Use a campus ID with at least 3 characters.'
    } else if (form.campusId.trim().length > 40) {
      nextErrors.campusId = 'Campus ID must be 40 characters or fewer.'
    }
    if (form.fullName.trim().length < 3) {
      nextErrors.fullName = 'Enter your full name.'
    } else if (form.fullName.trim().length > 120) {
      nextErrors.fullName = 'Full name must be 120 characters or fewer.'
    }
    if (!isValidEmail(form.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!isStrongPassword(form.password)) {
      nextErrors.password =
        'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
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
      const response = await register(form)
      navigate(response.redirectTo, { replace: true })
    } catch (error) {
      const apiError = toApiError(error, 'Unable to create your account right now.')
      setErrors(apiError.fieldErrors || {})
      setSubmitError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="panel mx-auto grid min-h-[calc(100vh-8.75rem)] max-w-[1320px] overflow-hidden rounded-[36px] lg:grid-cols-[0.86fr_1.14fr]">
      <section className="hidden bg-[linear-gradient(165deg,color-mix(in_srgb,var(--primary)_16%,var(--surface))_0%,color-mix(in_srgb,var(--secondary)_18%,var(--surface))_100%)] p-10 lg:flex">
        <div className="flex flex-col justify-between gap-10">
          <div className="space-y-5">
            <p className="font-display text-3xl font-semibold text-[var(--heading-color)]">USER registration only</p>
            <h1 className="font-display text-5xl font-semibold leading-tight text-[var(--heading-color)]">
              Technician and admin access stays controlled.
            </h1>
            <p className="max-w-lg text-base leading-8 text-[var(--muted-text)]">
              This register flow creates only standard campus user accounts. Higher-privilege roles must be invited or
              pre-created by an administrator.
            </p>
          </div>
          <div className="surface-soft-panel rounded-[28px] p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--primary)]">What happens next</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text)]">
              <li>Local credentials are stored securely with strong hashing.</li>
              <li>Your role is assigned by the backend, not by the form.</li>
              <li>Dashboard routing happens after the session is created.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="flex items-center px-6 py-8 sm:px-10">
        <div className="mx-auto w-full max-w-xl space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--primary)_18%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))] px-4 py-2 text-sm font-semibold text-[var(--primary)]">
              <ShieldCheck className="h-4 w-4" />
              Create a USER account
            </span>
            <div>
              <h2 className="font-display text-4xl font-semibold">Register your campus profile</h2>
              <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
                This flow is for standard users only. Technician and admin access must come through admin-led onboarding.
              </p>
            </div>
          </div>

          {submitError ? (
            <AlertBanner onClose={() => setSubmitError('')}>
              {submitError}
            </AlertBanner>
          ) : null}

          <form className="grid gap-5" onSubmit={handleSubmit}>
            {[
              { label: 'Campus ID', name: 'campusId', placeholder: 'it23833548' },
              { label: 'Full name', name: 'fullName', placeholder: 'Afnath Ahamed' },
              { label: 'Email', name: 'email', placeholder: 'name@campus.edu', type: 'email' },
              { label: 'Password', name: 'password', placeholder: 'Create a strong password', type: 'password' },
            ].map((field) => (
              <label key={field.name} className="block space-y-2">
                <span className="text-sm font-semibold">{field.label}</span>
                <input
                  type={field.type || 'text'}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 outline-none transition"
                />
                {errors[field.name] ? (
                  <p className="text-sm text-[var(--danger-foreground)]">{errors[field.name]}</p>
                ) : null}
              </label>
            ))}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-[22px] px-5 py-4 text-sm font-semibold disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="text-sm text-[var(--text-muted)]">
            Already have access?{' '}
            <Link to="/login" className="font-semibold text-[var(--primary)] hover:text-[var(--button-primary-end)]">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}

