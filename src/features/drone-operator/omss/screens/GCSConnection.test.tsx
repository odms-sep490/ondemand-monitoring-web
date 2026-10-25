import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import GCSConnection from './GCSConnection'
import type { Drone, Mission } from '../../types/omss'

vi.mock('../../api/flightControlApi', () => ({
  flightControlApi: {
    status: vi.fn(),
    bindSession: vi.fn(),
    releaseSession: vi.fn(),
  },
}))

const mission = {
  id: 'MS-1',
  orderRef: 'ORD-1',
  title: 'Mission',
  state: 'SCHEDULED',
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

describe('GCSConnection', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <GCSConnection
        mission={mission}
        drone={drone}
        onConnected={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    expect(screen.getByText('Kết nối GCS')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <GCSConnection
        mission={mission}
        drone={drone}
        onConnected={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('GCS connection')).toBeInTheDocument()
  })
})
