import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import DroneReplacement from './DroneReplacement'
import type { Drone } from '../../types/omss'

const current = {
  id: 'DRN-1',
  name: 'DRN-1',
  model: 'X500',
  serialNumber: 'DRN-1',
  state: 'MAINTENANCE',
  battery: 10,
  gpsCount: 3,
  storageMB: 100,
} as Drone

const replacements = [
  {
    id: 'DRN-2',
    name: 'DRN-2',
    model: 'X500',
    serialNumber: 'DRN-2',
    state: 'AVAILABLE',
    battery: 95,
    gpsCount: 12,
    storageMB: 5000,
  } as Drone,
]

describe('DroneReplacement', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <DroneReplacement
        current={current}
        replacements={replacements}
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    expect(screen.getByText('Chọn drone thay thế')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <DroneReplacement
        current={current}
        replacements={replacements}
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Select replacement drone')).toBeInTheDocument()
  })
})
