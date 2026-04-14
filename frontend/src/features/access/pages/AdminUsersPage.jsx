import { RefreshCw, ShieldCheck, UserCog } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { api, toApiError } from '../../../lib/api.js'
import { accountStatusOptions, authProviderOptions, userRoleOptions } from '../api/adminUsers.js'
import { supportsLocalAuthProvider } from '../../../lib/validation.js'

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [search, setSearch] = useState('')
  const [busyUserId, setBusyUserId] = useState('')
  const [authProviderDrafts, setAuthProviderDrafts] = useState({})
  const [passwordDrafts, setPasswordDrafts] = useState({})

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/api/admin/users')
      setUsers(response.data)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not load campus users.').message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return users
    }

    return users.filter((user) =>
      [user.fullName, user.email, user.campusId, user.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [search, users])

  const updateUser = async (userId, path, payload, successText) => {
    setBusyUserId(userId)
    setError('')
    setSuccessMessage('')

    try {
      const response = await api.put(`/api/admin/users/${userId}/${path}`, payload)
      setUsers((current) => current.map((user) => (user.id === userId ? response.data : user)))
      if (path === 'auth-provider') {
        setAuthProviderDrafts((current) => {
          const next = { ...current }
          delete next[userId]
          return next
        })
        setPasswordDrafts((current) => {
          const next = { ...current }
          delete next[userId]
          return next
        })
      }
      setSuccessMessage(successText)
    } catch (requestError) {
      setError(toApiError(requestError, 'Could not update that user account.').message)
    } finally {
      setBusyUserId('')
    }
  }

  const validateAuthProviderChange = (targetUser) => {
    const nextProvider = authProviderDrafts[targetUser.id] || targetUser.authProviderType
    const nextPassword = passwordDrafts[targetUser.id]?.trim() || ''
    const wasLocalEnabled = supportsLocalAuthProvider(targetUser.authProviderType)
    const willLocalBeEnabled = supportsLocalAuthProvider(nextProvider)

    if (!willLocalBeEnabled && nextPassword) {
      return 'Do not provide a password when local sign-in is disabled.'
    }

    if (willLocalBeEnabled && !wasLocalEnabled && nextPassword.length < 8) {
      return 'Provide a password with at least 8 characters when enabling local sign-in.'
    }

    if (willLocalBeEnabled && nextPassword && nextPassword.length < 8) {
      return 'Password updates must be at least 8 characters long.'
    }

    return ''
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Admin users</p>
            <h1 className="font-display mt-4 text-4xl font-semibold">Role, status, and provider governance</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              Review campus accounts, disable access when needed, and update role or authentication provider settings
              without breaking backend ownership rules.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[var(--border)] px-5 py-3.5 text-sm font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh users
          </button>
        </div>
      </section>

      {successMessage ? (
        <div className="rounded-[24px] border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-5 py-4 text-sm text-[var(--primary)]">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-5 py-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-4">
        <label className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <UserCog className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, campus ID, or role"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
      </section>

      <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`admin-user-skeleton-${index}`}
                className="animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="h-6 w-1/3 rounded-full bg-[var(--surface-muted)]" />
                <div className="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
              </div>
            ))}
          </div>
        ) : visibleUsers.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-muted)]">
            No users match this view.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleUsers.map((user) => (
              <article key={user.id} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl font-semibold">{user.fullName}</h2>
                      <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                        {user.campusId}
                      </span>
                      <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                        {user.role}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
                      <span>{user.email}</span>
                      <span>Status {user.accountStatus}</span>
                      <span>Provider {user.authProviderType}</span>
                      <span>Google linked {user.googleLinked ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  <div className="grid w-full max-w-[430px] gap-3">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold">Role</span>
                      <select
                        value={user.role}
                        onChange={(event) =>
                          updateUser(user.id, 'role', { role: event.target.value }, 'User role updated successfully.')
                        }
                        disabled={busyUserId === user.id || currentUser?.id === user.id}
                        className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
                      >
                        {userRoleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {currentUser?.id === user.id ? (
                        <p className="text-xs text-[var(--text-muted)]">
                          Use another admin account to change your own role.
                        </p>
                      ) : null}
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold">Account status</span>
                      <select
                        value={user.accountStatus}
                        onChange={(event) =>
                          updateUser(
                            user.id,
                            'status',
                            { status: event.target.value },
                            'Account status updated successfully.',
                          )
                        }
                        disabled={busyUserId === user.id || currentUser?.id === user.id}
                        className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
                      >
                        {accountStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {currentUser?.id === user.id ? (
                        <p className="text-xs text-[var(--text-muted)]">
                          Use another admin account to change your own access status.
                        </p>
                      ) : null}
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold">Auth provider</span>
                      <select
                        value={authProviderDrafts[user.id] || user.authProviderType}
                        onChange={(event) =>
                          setAuthProviderDrafts((current) => ({ ...current, [user.id]: event.target.value }))
                        }
                        className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
                      >
                        {authProviderOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-semibold">Initial password for local access</span>
                      <input
                        type="password"
                        value={passwordDrafts[user.id] || ''}
                        onChange={(event) =>
                          setPasswordDrafts((current) => ({ ...current, [user.id]: event.target.value }))
                        }
                        placeholder="Required when enabling local login on accounts without one"
                        className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const validationMessage = validateAuthProviderChange(user)
                        if (validationMessage) {
                          setError(validationMessage)
                          setSuccessMessage('')
                          return
                        }

                        updateUser(
                          user.id,
                          'auth-provider',
                          {
                            authProviderType: authProviderDrafts[user.id] || user.authProviderType,
                            initialPassword: passwordDrafts[user.id]?.trim() || null,
                          },
                          'Authentication provider updated successfully.',
                        )
                      }}
                      disabled={busyUserId === user.id}
                      className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-[var(--border)] px-4 py-3 text-sm font-semibold"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Save auth settings
                    </button>
                    {supportsLocalAuthProvider(authProviderDrafts[user.id] || user.authProviderType) &&
                    !supportsLocalAuthProvider(user.authProviderType) ? (
                      <p className="text-xs text-[var(--text-muted)]">
                        This account needs a new local password before local sign-in can be enabled.
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

