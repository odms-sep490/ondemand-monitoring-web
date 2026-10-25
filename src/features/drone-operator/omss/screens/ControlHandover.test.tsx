import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import ControlHandover from './ControlHandover'
import type { Drone, Mission } from '../../types/omss'

const mission = {
  id: 'MS-1',
  orderRef: 'ORD-1',
  title: 'Mission',
  state: 'PREFLIGHT_CHECKING',
  priority: 'NORMAL',
  droneId: 'DRN-1',
  operatorId: 'OP-1',
  customer: 'Customer',
  location: 'Loc',
  lat: 0,
  lng: 0,
  scheduledAt: new Date().toISOString(),
  estimatedMinutes: 5,
  distanceKm: 1,
  flightPlanId: 'PLAN-1',
  maxAltitudeM: 30,
  notes: '',
} as Mission

const drone = {
  id: 'DRN-1',
  name: 'DRN-1',
  model: 'X500',
  serialNumber: 'DRN-1',
  state: 'PREFLIGHT',
  battery: 90,
  gpsCount: 10,
  storageMB: 100,
} as Drone

describe('ControlHandover', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <ControlHandover
        mission={mission}
        drone={drone}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    expect(screen.getByText('Bàn giao quyền điều khiển')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <ControlHandover
        mission={mission}
        drone={drone}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Control handover')).toBeInTheDocument()
  })
})
