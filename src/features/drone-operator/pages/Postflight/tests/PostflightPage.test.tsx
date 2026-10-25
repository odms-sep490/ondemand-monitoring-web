import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { PostflightPage } from '../PostflightPage'

// useActiveMission's mission list comes from the real (unmocked) mission
// API, so it settles on no active mission and the screen shows its
// bilingual "mission not found" empty state.
describe('PostflightScreen', () => {
  it('renders the vietnamese empty state', async () => {
    render(<PostflightPage />)
    expect(
      await screen.findByText('Không tìm thấy thông tin nhiệm vụ', {}, { timeout: 5000 }),
    ).toBeTruthy()
  })

  it('renders the english empty state when language is switched', async () => {
    render(<PostflightPage />)
    await screen.findByText('Không tìm thấy thông tin nhiệm vụ', {}, { timeout: 5000 })
    act(() => setLanguage('en'))
    expect(
      await screen.findByText('Mission information not found', {}, { timeout: 5000 }),
    ).toBeTruthy()
  })
})
