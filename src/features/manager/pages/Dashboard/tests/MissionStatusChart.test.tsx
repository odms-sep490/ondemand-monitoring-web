import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { MissionStatusChart } from '../components/MissionStatusChart'

describe('MissionStatusChart', () => {
  it('shows the vi empty-state copy when there is no data', () => {
    render(<MissionStatusChart days={[]} />)
    expect(
      screen.getByText('Chưa có mission trong 7 ngày qua'),
    ).toBeInTheDocument()
  })

  it('shows the en empty-state copy after switching language', () => {
    render(<MissionStatusChart days={[]} />)
    act(() => setLanguage('en'))
    expect(
      screen.getByText('No missions in the last 7 days'),
    ).toBeInTheDocument()
  })

  it('renders the vi chart caption/day header with data', () => {
    render(
      <MissionStatusChart
        days={[
          {
            date: '2026-09-19',
            completed: 3,
            inFlight: 1,
            failed: 0,
            cancelled: 0,
          },
        ]}
      />,
    )
    expect(
      screen.getByText('Mission theo trạng thái, 7 ngày gần nhất'),
    ).toBeInTheDocument()
    expect(screen.getByText('Ngày')).toBeInTheDocument()
  })
})
