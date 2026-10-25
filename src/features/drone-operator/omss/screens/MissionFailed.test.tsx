import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import MissionFailed from './MissionFailed'
import type { Drone, Mission } from '../../types/omss'

const mission = {
  id: 'MS-1',
  orderRef: 'ORD-1',
  title: 'Mission',
  state: 'FAILED',
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
  state: 'MAINTENANCE',
  battery: 10,
  gpsCount: 0,
  storageMB: 0,
} as Drone

describe('MissionFailed', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <MissionFailed
        mission={mission}
        drone={drone}
        reason="Test"
        onMissions={vi.fn()}
      />,
    )
    expect(screen.getByText('Nhiệm vụ thất bại')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <MissionFailed
        mission={mission}
        drone={drone}
        reason="Test"
        onMissions={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Mission failed')).toBeInTheDocument()
  })
})
