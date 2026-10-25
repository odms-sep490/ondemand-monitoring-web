import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import MissionCompleted from './MissionCompleted'
import type { Drone, Mission } from '../../types/omss'

const mission = {
  id: 'MS-1',
  orderRef: 'ORD-1',
  title: 'Mission',
  state: 'COMPLETED',
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
  state: 'AVAILABLE',
  battery: 90,
  gpsCount: 10,
  storageMB: 100,
} as Drone

describe('MissionCompleted', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <MissionCompleted
        mission={mission}
        drone={drone}
        onMedia={vi.fn()}
        onMissions={vi.fn()}
      />,
    )
    expect(screen.getByText('Nhiệm vụ hoàn thành')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <MissionCompleted
        mission={mission}
        drone={drone}
        onMedia={vi.fn()}
        onMissions={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Mission completed')).toBeInTheDocument()
  })
})
