import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import MissionDetail from './MissionDetail'
import type { Drone, Mission } from '../../types/omss'

const mission = {
  id: 'MS-1',
  orderRef: 'ORD-1',
  title: 'Mission',
  state: 'IN_FLIGHT',
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
  routePoints: [],
} as Mission

const drone = {
  id: 'DRN-1',
  name: 'DRN-1',
  model: 'X500',
  serialNumber: 'DRN-1',
  state: 'ACTIVE_MISSION',
  battery: 90,
  gpsCount: 10,
  storageMB: 100,
} as Drone

describe('MissionDetail i18n', () => {
  it('renders Vietnamese text by default', () => {
    setLanguage('vi')
    render(
      <MissionDetail
        mission={mission}
        drone={drone}
        onScreen={vi.fn()}
        onBack={vi.fn()}
        onStartFlight={vi.fn()}
      />,
    )
    expect(screen.getByText('Chi tiết nhiệm vụ')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <MissionDetail
        mission={mission}
        drone={drone}
        onScreen={vi.fn()}
        onBack={vi.fn()}
        onStartFlight={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Mission details')).toBeInTheDocument()
  })
})
