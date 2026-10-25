import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { DroneStatusDonut } from '../components/DroneStatusDonut'

const data = [
  { status: 'AVAILABLE' as const, count: 5 },
  { status: 'MAINTENANCE' as const, count: 1 },
]

describe('DroneStatusDonut', () => {
  it('renders the vi unit label and aria-label by default', () => {
    render(<DroneStatusDonut data={data} />)
    expect(screen.getAllByText('drone').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('img', { name: /Trạng thái đội drone/ }),
    ).toBeInTheDocument()
  })

  it('renders the en aria-label after switching language', () => {
    render(<DroneStatusDonut data={data} />)
    act(() => setLanguage('en'))
    expect(
      screen.getByRole('img', { name: /Drone fleet status/ }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('drones').length).toBeGreaterThan(0)
  })
})
