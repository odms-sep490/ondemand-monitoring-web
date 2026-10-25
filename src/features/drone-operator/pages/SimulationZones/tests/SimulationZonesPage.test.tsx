import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import SimulationZones from '../SimulationZonesPage'

describe('SimulationZones', () => {
  it('renders Vietnamese text by default', () => {
    render(<SimulationZones />)
    expect(screen.getByText('Bản đồ khu vực')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(<SimulationZones />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Zone map')).toBeInTheDocument()
  })
})
