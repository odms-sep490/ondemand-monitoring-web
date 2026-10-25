import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import ReadyToFly from './ReadyToFly'
import type { Drone, FlightToken, Mission } from '../../types/omss'

const mission = {
  id: 'MS-1',
  orderRef: 'ORD-1',
  title: 'Mission',
  state: 'READY_TO_FLY',
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

const token = {
  token: 'TOKEN-1',
  issuedAt: Date.now(),
  expiresAt: Date.now() + 15 * 60_000,
  missionId: 'MS-1',
  droneId: 'DRN-1',
} as FlightToken

describe('ReadyToFly', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <ReadyToFly
        mission={mission}
        drone={drone}
        token={token}
        onStart={vi.fn()}
        onAbort={vi.fn()}
      />,
    )
    expect(
      screen.getByText(
        'Mọi yêu cầu kiểm tra trước bay đã được đáp ứng. Xem lại và bắt đầu nhiệm vụ.',
      ),
    ).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <ReadyToFly
        mission={mission}
        drone={drone}
        token={token}
        onStart={vi.fn()}
        onAbort={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(
      screen.getByText(
        'All pre-flight requirements have been met. Review and start the mission.',
      ),
    ).toBeInTheDocument()
  })
})
