import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../shared/i18n'
import OperatorOverview from './OperatorOverview'
import type { Mission } from '../../types/omss'

const missions = [
  {
    id: 'MS-1',
    orderRef: 'ORD-1',
    title: 'Mission',
    state: 'WAITING_OPERATOR_ACCEPTANCE',
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

describe('OperatorOverview', () => {
  it('renders Vietnamese text by default', () => {
    render(
      <OperatorOverview
        allMissions={missions}
        operatorName="Operator"
        operatorId="OP-1"
        onGoMissions={vi.fn()}
        onGoMission={vi.fn()}
      />,
    )
    expect(screen.getByText('Chào mừng, Operator')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <OperatorOverview
        allMissions={missions}
        operatorName="Operator"
        operatorId="OP-1"
        onGoMissions={vi.fn()}
        onGoMission={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Welcome, Operator')).toBeInTheDocument()
  })
})
