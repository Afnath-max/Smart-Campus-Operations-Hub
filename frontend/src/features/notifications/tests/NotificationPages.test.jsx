import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationContext } from '../../../context/NotificationContext.jsx'
import { NotificationsPage } from '../pages/NotificationsPage.jsx'

const { apiMock, setUnreadCountMock } = vi.hoisted(() => ({
  apiMock: {
    delete: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
  setUnreadCountMock: vi.fn(),
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

describe('notification pages', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.put.mockReset()
    apiMock.delete.mockReset()
    setUnreadCountMock.mockReset()
  })

  it('marks a notification as read and opens its related route', async () => {
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: 'notif-1',
          type: 'BOOKING_APPROVED',
          title: 'Booking approved',
          message: 'Engineering Lab was approved.',
          link: '/bookings/my',
          read: false,
          readAt: null,
          createdAt: '2026-04-13T10:30:00.000Z',
        },
      ],
    })

    apiMock.put.mockResolvedValueOnce({
      data: {
        id: 'notif-1',
        type: 'BOOKING_APPROVED',
        title: 'Booking approved',
        message: 'Engineering Lab was approved.',
        link: '/bookings/my',
        read: true,
        readAt: '2026-04-13T10:45:00.000Z',
        createdAt: '2026-04-13T10:30:00.000Z',
      },
    })

    render(
      <NotificationContext.Provider value={{ unreadCount: 1, setUnreadCount: setUnreadCountMock }}>
        <MemoryRouter initialEntries={['/notifications']}>
          <Routes>
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/bookings/my" element={<div>Bookings destination</div>} />
          </Routes>
        </MemoryRouter>
      </NotificationContext.Provider>,
    )

    expect(await screen.findByRole('heading', { name: 'Booking approved' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /open related item/i }))

    expect(await screen.findByText('Bookings destination')).toBeInTheDocument()
    expect(apiMock.put).toHaveBeenCalledWith('/api/notifications/notif-1/read')
    await waitFor(() => expect(setUnreadCountMock).toHaveBeenCalledWith(0))
  })
})

