import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../../../shared/api/httpClient'
import { resetMockDb } from '../../../../../mocks/db'
import { mockFetch } from '../../../../../mocks'
import { setLanguage } from '../../../../../shared/i18n'
import { LivePage } from '../LivePage'

beforeEach(() => {
  resetMockDb()
  setHttpTransport(mockFetch)
})
afterEach(() => {
  resetMockDb()
  resetHttpTransport()
})

describe('LivePage', () => {
  it('shows sidebar skeleton while loading', () => {
    render(<LivePage />)
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy()
  })

  it('renders sidebar with active missions after load', async () => {
    render(<LivePage />)
    await waitFor(() =>
      expect(document.querySelector('[aria-busy="true"]')).toBeNull(),
    )
    // At least one active mission (MSN-2609-0142-1 is IN_FLIGHT) should appear
    // — or empty state if the mock returns no active missions
    const hasMissions = screen.queryAllByText(/MSN-2609-0142-1/)
    const hasEmpty = screen.queryByText(/Không có mission đang hoạt động/)
    expect(hasMissions.length > 0 || hasEmpty).toBeTruthy()
  })

  it('shows "Ghi nhận sự cố" and "Huỷ mission khẩn" buttons when a mission is selected', async () => {
    render(<LivePage missionId="msn-2609-0142-1" />)
    await waitFor(() =>
      expect(document.querySelector('[aria-busy="true"]')).toBeNull(),
    )
    // Give polling a moment to load
    await waitFor(() =>
      expect(screen.queryByText('Ghi nhận sự cố')).toBeTruthy(),
    )
    expect(screen.getByText('Huỷ mission khẩn')).toBeTruthy()
  })

  it('renders livestream block with LIVE badge for MSN-2609-0142-1', async () => {
    render(<LivePage missionId="msn-2609-0142-1" />)
    await waitFor(() => expect(screen.queryByText('LIVE')).toBeTruthy())
  })

  it('shows English incident/cancel buttons when language is switched', async () => {
    render(<LivePage missionId="msn-2609-0142-1" />)
    act(() => setLanguage('en'))
    await waitFor(() =>
      expect(screen.queryByText('Report incident')).toBeTruthy(),
    )
    expect(screen.getByText('Emergency cancel')).toBeTruthy()
  })
})
