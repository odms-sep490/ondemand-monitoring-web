import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

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

  it('renders the office workspace and fallback areas after data loads', async () => {
    render(<SchedulePage />)
    await screen.findByRole(
      'heading',
      { name: 'Đội ngũ và công việc' },
      { timeout: 12_000 },
    )
    expect(screen.getByRole('region', { name: 'Không gian làm việc' })).toBeTruthy()
    expect(screen.getByText(/Chưa tải được mô hình văn phòng 3D/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Phòng họp' })).toBeTruthy()
  }, 15_000)

  it('selects an office area from the fallback view', async () => {
    render(<SchedulePage />)
    await screen.findByRole(
      'heading',
      { name: 'Đội ngũ và công việc' },
      { timeout: 5_000 },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Phòng họp' }))
    expect(screen.getAllByText('Phòng họp').length).toBeGreaterThan(1)
  })

  it('pauses and resumes the illustrative staff movement', async () => {
    render(<SchedulePage />)
    await screen.findByRole(
      'heading',
      { name: 'Đội ngũ và công việc' },
      { timeout: 5_000 },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng chuyển động' }))
    expect(screen.getByRole('button', { name: 'Tiếp tục chuyển động' })).toBeTruthy()
  })

  it('renders the English title and nav buttons when language is switched', async () => {
    render(<SchedulePage />)
    await screen.findByRole(
      'heading',
      { name: 'Đội ngũ và công việc' },
      { timeout: 5_000 },
    )
    act(() => setLanguage('en'))
    expect(await screen.findByRole('heading', { name: 'Team and active work' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Meeting room' })).toBeTruthy()
  })
})
