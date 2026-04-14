import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../../../context/AuthContext.jsx'
import { ThemeProvider } from '../../../context/ThemeContext.jsx'
import { AdminUsersPage } from '../pages/AdminUsersPage.jsx'

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

vi.mock('../../../lib/api.js', () => ({
  api: apiMock,
  toApiError: (error, fallbackMessage) =>
    error?.response?.data || {
      code: 'REQUEST_FAILED',
      message: fallbackMessage,
      fieldErrors: {},
    },
}))

function renderPage() {
  return render(
    <ThemeProvider>
      <AuthContext.Provider
        value={{
          user: {
            id: 'admin-current',
            role: 'ADMIN',
            fullName: 'Campus Admin',
            email: 'admin@campus.edu',
            campusId: 'admin001',
            authProviderType: 'LOCAL',
            googleLinked: false,
          },
        }}
      >
        <MemoryRouter>
          <AdminUsersPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>,
  )
}

describe('admin users page', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.put.mockReset()
  })

  it('allows saving auth settings for an existing local account without forcing a new password', async () => {
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: 'user-local',
          campusId: 'user001',
          email: 'user@campus.edu',
          fullName: 'Campus User',
          role: 'USER',
          accountStatus: 'ACTIVE',
          authProviderType: 'LOCAL',
          googleLinked: false,
        },
      ],
    })
    apiMock.put.mockResolvedValueOnce({
      data: {
        id: 'user-local',
        campusId: 'user001',
        email: 'user@campus.edu',
        fullName: 'Campus User',
        role: 'USER',
        accountStatus: 'ACTIVE',
        authProviderType: 'LOCAL',
        googleLinked: false,
      },
    })

    renderPage()

    expect(await screen.findByText('Campus User')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /save auth settings/i }))

    expect(apiMock.put).toHaveBeenCalledWith('/api/admin/users/user-local/auth-provider', {
      authProviderType: 'LOCAL',
      initialPassword: null,
    })
  })

  it('blocks enabling local login for a google-only account without a password', async () => {
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: 'user-google',
          campusId: 'user002',
          email: 'google@campus.edu',
          fullName: 'Google User',
          role: 'USER',
          accountStatus: 'ACTIVE',
          authProviderType: 'GOOGLE',
          googleLinked: true,
        },
      ],
    })

    renderPage()

    expect(await screen.findByText('Google User')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/auth provider/i), { target: { value: 'BOTH' } })
    fireEvent.click(screen.getByRole('button', { name: /save auth settings/i }))

    expect(
      await screen.findByText('Provide a password with at least 8 characters when enabling local sign-in.'),
    ).toBeInTheDocument()
    expect(apiMock.put).not.toHaveBeenCalled()
  })
})

