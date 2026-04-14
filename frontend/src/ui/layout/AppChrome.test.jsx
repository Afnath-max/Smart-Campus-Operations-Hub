import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthContext } from '../../context/AuthContext.jsx'
import { NotificationContext } from '../../context/NotificationContext.jsx'
import { ThemeProvider } from '../../context/ThemeContext.jsx'
import { PublicLayout } from './PublicLayout.jsx'
import { AppShell } from './AppShell.jsx'
import { LandingPage } from '../pages/LandingPage.jsx'

function renderWithChrome(ui, { authValue, notificationsValue, initialEntries = ['/'] }) {
  return render(
    <ThemeProvider>
      <AuthContext.Provider value={authValue}>
        <NotificationContext.Provider
          value={notificationsValue || { unreadCount: 0, refreshUnreadCount: vi.fn(), setUnreadCount: vi.fn() }}
        >
          <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
        </NotificationContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>,
  )
}

describe('app navigation chrome', () => {
  it('shows guest navigation actions in the public navbar', () => {
    renderWithChrome(
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
      </Routes>,
      { authValue: {} },
    )

    const banner = screen.getByRole('banner')

    expect(within(banner).getByRole('link', { name: /^sign in$/i })).toBeInTheDocument()
    expect(within(banner).getByRole('link', { name: /create account/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /open user menu/i })).not.toBeInTheDocument()
  })

  it('shows a logged-in profile menu with role shortcuts and sign out', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)

    renderWithChrome(
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<div>Campus landing surface</div>} />
        </Route>
        <Route element={<AppShell />}>
          <Route path="/notifications" element={<div>Notification center</div>} />
          <Route path="/technician/dashboard" element={<div>Technician board</div>} />
        </Route>
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>,
      {
        authValue: {
          user: {
            role: 'TECHNICIAN',
            fullName: 'Lead Technician',
            email: 'technician@smartcampus.local',
            campusId: 'tech001',
            authProviderType: 'LOCAL',
            googleLinked: false,
          },
          logout,
          beginGoogleLink: vi.fn().mockResolvedValue({ authorizationUrl: '/oauth2/authorization/google' }),
        },
        notificationsValue: { unreadCount: 4, refreshUnreadCount: vi.fn(), setUnreadCount: vi.fn() },
        initialEntries: ['/notifications'],
      },
    )

    fireEvent.click(screen.getByRole('button', { name: /open user menu/i }))
    const menu = await screen.findByRole('menu', { name: /user menu/i })

    expect(within(menu).getByText('Dashboard')).toBeInTheDocument()
    expect(within(menu).getByText('Notifications')).toBeInTheDocument()
    expect(within(menu).queryByText('Alert settings')).not.toBeInTheDocument()
    expect(within(menu).getByText('Link Google')).toBeInTheDocument()

    fireEvent.click(within(menu).getByRole('link', { name: /dashboard/i }))
    expect(await screen.findByText('Technician board')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /open user menu/i }))
    fireEvent.click(within(await screen.findByRole('menu', { name: /user menu/i })).getByRole('button', { name: /sign out/i }))

    expect(logout).toHaveBeenCalled()
    expect(await screen.findByText('Login screen')).toBeInTheDocument()
  })

  it('shows dashboard and profile actions instead of guest auth buttons on the landing page for signed-in users', () => {
    renderWithChrome(
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
      </Routes>,
      {
        authValue: {
          user: {
            role: 'ADMIN',
            fullName: 'Campus Administrator',
            email: 'admin@smartcampus.local',
            campusId: 'admin001',
            authProviderType: 'LOCAL',
            googleLinked: false,
          },
          logout: vi.fn(),
          beginGoogleLink: vi.fn(),
        },
      },
    )

    const banner = screen.getByRole('banner')

    expect(within(banner).getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(within(banner).getByRole('button', { name: /open user menu/i })).toBeInTheDocument()
    expect(within(banner).queryByRole('link', { name: /^sign in$/i })).not.toBeInTheDocument()
    expect(within(banner).queryByRole('link', { name: /create account/i })).not.toBeInTheDocument()
  })

  it('hides the google link action for google-only accounts', async () => {
    renderWithChrome(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<div>User board</div>} />
        </Route>
      </Routes>,
      {
        authValue: {
          user: {
            role: 'USER',
            fullName: 'Campus User',
            email: 'user@campus.edu',
            campusId: 'user001',
            authProviderType: 'GOOGLE',
            googleLinked: true,
          },
          logout: vi.fn(),
          beginGoogleLink: vi.fn(),
        },
        initialEntries: ['/dashboard'],
      },
    )

    fireEvent.click(screen.getByRole('button', { name: /open user menu/i }))
    const menu = await screen.findByRole('menu', { name: /user menu/i })

    expect(within(menu).getByText('Dashboard')).toBeInTheDocument()
    expect(within(menu).queryByText('Link Google')).not.toBeInTheDocument()
  })
})
