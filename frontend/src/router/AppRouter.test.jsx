import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './AppRouter.jsx'

function renderWithAuth(ui, authValue, initialEntries = ['/']) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('route guards', () => {
  it('redirects unauthenticated users to login', async () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
          <Route path="/dashboard" element={<div>User dashboard</div>} />
        </Route>
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>,
      { status: 'unauthenticated', user: null },
      ['/dashboard'],
    )

    expect(await screen.findByText('Login screen')).toBeInTheDocument()
  })

  it('redirects authenticated users away from public routes', async () => {
    renderWithAuth(
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<div>Login page</div>} />
        </Route>
        <Route path="/admin/dashboard" element={<div>Admin home</div>} />
      </Routes>,
      { status: 'authenticated', user: { role: 'ADMIN' } },
      ['/login'],
    )

    expect(await screen.findByText('Admin home')).toBeInTheDocument()
  })

  it('redirects wrong-role users to their own dashboard', async () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<div>Admin home</div>} />
        </Route>
        <Route path="/technician/dashboard" element={<div>Technician home</div>} />
      </Routes>,
      { status: 'authenticated', user: { role: 'TECHNICIAN' } },
      ['/admin/dashboard'],
    )

    expect(await screen.findByText('Technician home')).toBeInTheDocument()
  })
})
