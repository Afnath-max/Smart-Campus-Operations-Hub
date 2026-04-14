import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthContext } from '../../../context/AuthContext.jsx'
import { ThemeProvider } from '../../../context/ThemeContext.jsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { RegisterPage } from '../pages/RegisterPage.jsx'
import { AppShell } from '../../../ui/layout/AppShell.jsx'

function renderWithProviders(ui, authValue, initialEntries = ['/login']) {
  return render(
    <ThemeProvider>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>,
  )
}

describe('auth pages', () => {
  it('submits login and redirects using backend role route', async () => {
    const login = vi.fn().mockResolvedValue({
      redirectTo: '/admin/dashboard',
      user: { role: 'ADMIN' },
    })

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={<div>Admin target</div>} />
      </Routes>,
      { login },
    )

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'admin@campus.edu' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Admin@12345' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Admin target')).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith({ email: 'admin@campus.edu', password: 'Admin@12345' })
  })

  it('blocks invalid login emails before submission', async () => {
    const login = vi.fn()

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>,
      { login },
    )

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'not-an-email' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Admin@12345' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('hides admin navigation from a standard user shell', async () => {
    renderWithProviders(
      <Routes>
        <Route
          element={
            <AppShell />
          }
        >
          <Route path="/dashboard" element={<div>User content</div>} />
        </Route>
      </Routes>,
      {
        user: {
          role: 'USER',
          fullName: 'Campus User',
          email: 'user@campus.edu',
          campusId: 'user001',
          authProviderType: 'LOCAL',
          googleLinked: false,
        },
        logout: vi.fn(),
        beginGoogleLink: vi.fn().mockResolvedValue({ authorizationUrl: '/oauth2/authorization/google' }),
      },
      ['/dashboard'],
    )

    expect(await screen.findByText('User content')).toBeInTheDocument()
    expect(screen.queryByText('Operations')).not.toBeInTheDocument()
    expect(screen.queryByText('Assigned Work')).not.toBeInTheDocument()
  })

  it('blocks weak passwords before register submission', async () => {
    const register = vi.fn()

    renderWithProviders(
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
      </Routes>,
      { register },
      ['/register'],
    )

    fireEvent.change(screen.getByLabelText(/campus id/i), { target: { value: 'user123' } })
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Campus User' } })
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'user@campus.edu' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'weakpass' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByText(
        'Use at least 8 characters with uppercase, lowercase, a number, and a special character.',
      ),
    ).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })
})

