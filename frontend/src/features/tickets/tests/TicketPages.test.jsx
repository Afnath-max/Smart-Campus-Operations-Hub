import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { TicketNewPage } from '../pages/TicketNewPage.jsx'

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../../../lib/api.js', () => ({
  api: apiMock,
  apiBaseUrl: 'http://localhost:8080',
  resolveApiUrl: (path) => `http://localhost:8080${path}`,
  toApiError: (error, fallbackMessage) =>
    error?.response?.data || {
      code: 'REQUEST_FAILED',
      message: fallbackMessage,
      fieldErrors: {},
    },
}))

describe('ticket pages', () => {
  beforeAll(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:preview')
    global.URL.revokeObjectURL = vi.fn()
  })

  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.post.mockReset()
  })

  it('blocks selecting more than three images in the ticket form', async () => {
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: 'resource-1',
          name: 'Engineering Lab',
          type: 'LAB',
          description: 'Engineering lab',
          capacity: 40,
          location: 'Block D',
          availableFrom: '08:00:00',
          availableTo: '18:00:00',
          status: 'ACTIVE',
        },
      ],
    })

    render(
      <MemoryRouter>
        <TicketNewPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Report a maintenance or incident ticket')).toBeInTheDocument()

    const files = [
      new File(['a'], 'issue-1.png', { type: 'image/png' }),
      new File(['b'], 'issue-2.png', { type: 'image/png' }),
      new File(['c'], 'issue-3.png', { type: 'image/png' }),
      new File(['d'], 'issue-4.png', { type: 'image/png' }),
    ]

    fireEvent.change(screen.getByLabelText(/ticket images/i), {
      target: { files },
    })

    fireEvent.change(screen.getByLabelText(/preferred contact/i), {
      target: { value: 'user@campus.edu / ext 145' },
    })
    fireEvent.change(screen.getByLabelText(/issue description/i), {
      target: { value: 'The projector in the engineering lab keeps flashing during scheduled sessions.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }))

    expect(await screen.findByText('You can upload up to 3 images.')).toBeInTheDocument()
    expect(apiMock.post).not.toHaveBeenCalled()
  })
})

