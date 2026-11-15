import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { authSession } from '../auth/api/authApi'
import {
  resetHttpTransport,
  setHttpTransport,
} from '../../shared/api/httpClient'
import { setLanguage } from '../../shared/i18n'
import { notificationReadStorageKey } from './readState'
import { NotificationBell } from './NotificationBell'

const feed = {
  items: [
    {
      id: 'mission:mission-1:mission_assigned',
      type: 'MISSION_ASSIGNED',
      entityId: 'mission-1',
      reference: 'MS-1',
      createdAt: new Date().toISOString(),
    },
  ],
}

beforeEach(() => {
  setLanguage('en')
  window.localStorage.clear()
  window.location.hash = '#portal/staff/missions'
  vi.spyOn(authSession, 'getUser').mockReturnValue({
    id: 'staff-1',
    fullName: 'Pilot One',
    email: 'pilot@example.test',
    role: 'STAFF',
  })
  setHttpTransport(
    async () => new Response(JSON.stringify({ success: true, data: feed })),
  )
})

afterEach(() => {
  resetHttpTransport()
  vi.restoreAllMocks()
  window.localStorage.clear()
  setLanguage('vi')
})

describe('NotificationBell', () => {
  it('opens without navigating, marks clicked notifications read, closes, and follows the existing mission route', async () => {
    render(<NotificationBell role="STAFF" />)

    const bell = screen.getByRole('button', { name: /Notifications/ })
    fireEvent.click(bell)
    const item = await screen.findByRole('link', { name: /Mission assigned/ })
    expect(window.location.hash).toBe('#portal/staff/missions')

    fireEvent.click(item)
    await waitFor(() =>
      expect(window.location.hash).toBe('#portal/staff/missions/mission-1'),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      JSON.parse(
        window.localStorage.getItem(notificationReadStorageKey('staff-1')) ??
          '[]',
      ),
    ).toContain('mission:mission-1:mission_assigned')
  })

  it('closes on Escape and restores focus to the bell', async () => {
    render(<NotificationBell role="STAFF" />)
    const bell = screen.getByRole('button', { name: /Notifications/ })
    fireEvent.click(bell)
    await screen.findByRole('dialog')

    act(() => fireEvent.keyDown(window, { key: 'Escape' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(bell).toHaveFocus()
  })

  it('closes when the user clicks outside the popover', async () => {
    render(<NotificationBell role="STAFF" />)
    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }))
    await screen.findByRole('dialog')

    fireEvent.pointerDown(document.body)

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('marks all notifications as read', async () => {
    render(<NotificationBell role="STAFF" />)
    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }))
    const item = await screen.findByRole('link', { name: /Mission assigned/ })

    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))

    expect(item).not.toHaveClass('is-unread')
    expect(
      screen.getByRole('button', { name: 'Mark all as read' }),
    ).toBeDisabled()
    expect(
      JSON.parse(
        window.localStorage.getItem(notificationReadStorageKey('staff-1')) ??
          '[]',
      ),
    ).toContain('mission:mission-1:mission_assigned')
  })

  it('renders the empty state when there are no notifications', async () => {
    setHttpTransport(
      async () =>
        new Response(JSON.stringify({ success: true, data: { items: [] } })),
    )
    render(<NotificationBell role="STAFF" />)
    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }))

    expect(await screen.findByText('You’re all caught up')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Mark all as read' }),
    ).toBeDisabled()
  })

  it('shows a retry action when the notification API fails', async () => {
    setHttpTransport(async () => {
      throw new Error('network unavailable')
    })
    render(<NotificationBell role="STAFF" />)
    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load notifications. Please try again.',
    )
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })
})
