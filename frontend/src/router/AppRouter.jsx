import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getDashboardPath } from '../lib/routes.js'
import { LoadingScreen } from '../ui/LoadingScreen.jsx'
import { AppShell } from '../ui/layout/AppShell.jsx'
import { PublicLayout } from '../ui/layout/PublicLayout.jsx'
import { AdminBookingsPage } from '../features/bookings/pages/AdminBookingsPage.jsx'
import { AdminAnalyticsPage } from '../ui/pages/AdminAnalyticsPage.jsx'
import { AdminResourcesPage } from '../features/resources/pages/AdminResourcesPage.jsx'
import { AdminTicketsPage } from '../features/tickets/pages/AdminTicketsPage.jsx'
import { AdminInvitationsPage } from '../features/access/pages/AdminInvitationsPage.jsx'
import { AdminUsersPage } from '../features/access/pages/AdminUsersPage.jsx'
import { BookingRequestPage } from '../features/bookings/pages/BookingRequestPage.jsx'
import { CataloguePage } from '../features/resources/pages/CataloguePage.jsx'
import { AdminDashboardPage, TechnicianDashboardPage, UserDashboardPage } from '../ui/pages/DashboardPages.jsx'
import { LandingPage } from '../ui/pages/LandingPage.jsx'
import { LoginPage } from '../features/access/pages/LoginPage.jsx'
import { MyBookingsPage } from '../features/bookings/pages/MyBookingsPage.jsx'
import { MyTicketsPage } from '../features/tickets/pages/MyTicketsPage.jsx'
import { NotificationSettingsPage } from '../features/notifications/pages/NotificationSettingsPage.jsx'
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage.jsx'
import { OAuthCallbackPage } from '../features/access/pages/OAuthCallbackPage.jsx'
import { ProfilePage } from '../features/access/pages/ProfilePage.jsx'
import { RegisterPage } from '../features/access/pages/RegisterPage.jsx'
import { TechnicianTicketsPage } from '../features/tickets/pages/TechnicianTicketsPage.jsx'
import { TicketDetailPage } from '../features/tickets/pages/TicketDetailPage.jsx'
import { TicketNewPage } from '../features/tickets/pages/TicketNewPage.jsx'

export function PublicOnlyRoute() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <LoadingScreen label="Preparing your workspace..." />
  }

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return <Outlet />
}

export function ProtectedRoute({ allowedRoles }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <LoadingScreen label="Loading your campus profile..." />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [{ path: '/', element: <LandingPage /> }],
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/oauth/callback', element: <OAuthCallbackPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['USER', 'TECHNICIAN', 'ADMIN']} />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/home', element: <Navigate to="/" replace /> },
          {
            element: <ProtectedRoute allowedRoles={['USER']} />,
            children: [
              { path: '/dashboard', element: <UserDashboardPage /> },
              { path: '/catalogue', element: <CataloguePage /> },
              { path: '/bookings/new', element: <BookingRequestPage /> },
              { path: '/bookings/my', element: <MyBookingsPage /> },
              { path: '/tickets/new', element: <TicketNewPage /> },
              { path: '/tickets/my', element: <MyTicketsPage /> },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={['TECHNICIAN']} />,
            children: [
              { path: '/technician/dashboard', element: <TechnicianDashboardPage /> },
              { path: '/technician/tickets', element: <TechnicianTicketsPage /> },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [
              { path: '/admin/dashboard', element: <AdminDashboardPage /> },
              { path: '/admin/resources', element: <AdminResourcesPage /> },
              { path: '/admin/bookings', element: <AdminBookingsPage /> },
              { path: '/admin/tickets', element: <AdminTicketsPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/invitations', element: <AdminInvitationsPage /> },
              { path: '/admin/analytics', element: <AdminAnalyticsPage /> },
            ],
          },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/settings/notifications', element: <NotificationSettingsPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/tickets/:id', element: <TicketDetailPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

