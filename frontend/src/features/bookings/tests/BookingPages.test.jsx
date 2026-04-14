import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BookingRequestPage } from '../pages/BookingRequestPage.jsx'

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
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

describe('booking pages', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.post.mockReset()
  })

  it('blocks invalid time ranges before submitting a booking request', async () => {
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: 'resource-1',
          name: 'Innovation Lab',
          type: 'LAB',
          description: 'High demand innovation lab',
          capacity: 20,
          location: 'Block A',
          availableFrom: '08:00:00',
          availableTo: '18:00:00',
          status: 'ACTIVE',
        },
      ],
    })

    render(
      <MemoryRouter>
        <BookingRequestPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Innovation Lab')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/booking date/i), { target: { value: '2026-04-20' } })
    fireEvent.change(screen.getByLabelText(/expected attendees/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '14:00' } })
    fireEvent.change(screen.getByLabelText(/end time/i), { target: { value: '13:00' } })
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: 'Faculty design review and planning session' },
    })

    fireEvent.click(screen.getByRole('button', { name: /submit booking request/i }))

    expect(await screen.findByText('Start time must be earlier than end time.')).toBeInTheDocument()
    expect(apiMock.post).not.toHaveBeenCalled()
  })
})

