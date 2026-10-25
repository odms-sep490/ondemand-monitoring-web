import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import ReturnToBase from './ReturnToBase'
import type { Drone } from '../../types/omss'

vi.mock('../../api/flightControlApi', () => ({
  flightControlApi: {
    status: vi.fn().mockResolvedValue({ online: true }),
  },
}))

const drone = {
  id: 'DRN-1',
  name: 'DRN-1',
  model: 'X500',
  serialNumber: 'DRN-1',
  state: 'ACTIVE_MISSION',
  battery: 60,
  gpsCount: 10,
  storageMB: 100,
} as Drone

describe('ReturnToBase', () => {
  it('renders Vietnamese text by default', () => {
    render(<ReturnToBase drone={drone} missionId="MS-1" onLanded={vi.fn()} />)
    expect(screen.getByText('Quay về căn cứ')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(<ReturnToBase drone={drone} missionId="MS-1" onLanded={vi.fn()} />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Return to base')).toBeInTheDocument()
  })
})
