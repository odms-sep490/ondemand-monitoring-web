import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import ReadyToFly from './ReadyToFly'
import type { Drone, Mission } from '../../types/omss'

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

describe('ReadyToFly', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <ReadyToFly
        mission={mission}
        drone={drone}
        onStart={vi.fn()}
        onAbort={vi.fn()}
      />,
    )
    expect(
      screen.getByText(
        'Precheck và bàn giao đã hoàn tất. Đang chờ staff nghiệm thu bắt đầu Mission.',
      ),
    ).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <ReadyToFly
        mission={mission}
        drone={drone}
        onStart={vi.fn()}
        onAbort={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(
      screen.getByText(
        'Preflight and handover are complete. Waiting for the inspector to start the mission.',
      ),
    ).toBeInTheDocument()
  })
})
