import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import MissionList from './MissionList'
import type { Mission } from '../../types/omss'

const missions = [
  {
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
  } as Mission,
]

describe('MissionList', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <MissionList missions={missions} onSelect={vi.fn()} onScreen={vi.fn()} />,
    )
    expect(screen.getByText('Nhiệm vụ của tôi')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <MissionList missions={missions} onSelect={vi.fn()} onScreen={vi.fn()} />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('My missions')).toBeInTheDocument()
  })
})
