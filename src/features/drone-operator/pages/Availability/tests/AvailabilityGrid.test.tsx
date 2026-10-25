import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { AvailabilityGrid } from '../components/AvailabilityGrid'

describe('AvailabilityGrid', () => {
  it('renders vietnamese weekday abbreviations', () => {
    render(
      <AvailabilityGrid
        days={['2026-09-21']}
        slots={{}}
        overlays={[]}
        onSelectionChange={vi.fn()}
      />,
    )
    expect(screen.getByText(/T2/)).toBeTruthy()
  })

  it('renders english weekday abbreviations when language is switched', () => {
    render(
      <AvailabilityGrid
        days={['2026-09-21']}
        slots={{}}
        overlays={[]}
        onSelectionChange={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText(/Mon/)).toBeTruthy()
  })
})
