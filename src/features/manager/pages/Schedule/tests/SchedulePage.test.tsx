import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../../../shared/api/httpClient'
import { resetMockDb } from '../../../../../mocks/db'
import { mockFetch } from '../../../../../mocks'
import { setLanguage } from '../../../../../shared/i18n'
import { SchedulePage } from '../SchedulePage'

beforeEach(() => {
  resetMockDb()
  setHttpTransport(mockFetch)
})
afterEach(() => {
  resetMockDb()
  resetHttpTransport()
})

describe('SchedulePage', () => {
  it('shows skeleton while loading', () => {
    render(<SchedulePage />)
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy()
  })

  it('renders grid or empty state after data loads', async () => {
    render(<SchedulePage />)
    await waitFor(() =>
      expect(document.querySelector('[aria-busy="true"]')).toBeNull(),
    )
    const grid = document.querySelector('[aria-label="Lịch nhiệm vụ theo tuần"]')
    const empty = screen.queryByText('Chưa có nhiệm vụ được lên lịch trong tuần này')
    expect(grid ?? empty).toBeTruthy()
  })

  it('prev/next week buttons are present and clickable', async () => {
    render(<SchedulePage />)
    await waitFor(() =>
      expect(document.querySelector('[aria-busy="true"]')).toBeNull(),
    )
    const prevBtn = screen.getByRole('button', { name: 'Tuần trước' })
    const nextBtn = screen.getByRole('button', { name: 'Tuần sau' })
    expect(prevBtn).toBeTruthy()
    expect(nextBtn).toBeTruthy()

    // Navigating to next and back should not crash
    fireEvent.click(nextBtn)
    fireEvent.click(prevBtn)
    expect(screen.getByRole('button', { name: 'Hôm nay' })).toBeTruthy()
  })

  it('"Hôm nay" button re-renders without crash', async () => {
    render(<SchedulePage />)
    await waitFor(() =>
      expect(document.querySelector('[aria-busy="true"]')).toBeNull(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tuần sau' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hôm nay' }))
    expect(screen.getByRole('button', { name: 'Hôm nay' })).toBeTruthy()
  })

  it('renders the English title and nav buttons when language is switched', async () => {
    render(<SchedulePage />)
    await waitFor(() =>
      expect(document.querySelector('[aria-busy="true"]')).toBeNull(),
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Mission schedule')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy()
  })
})
