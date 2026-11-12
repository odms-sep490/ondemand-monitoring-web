import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { FlightStepper } from '../FlightStepper'

describe('FlightStepper', () => {
  it('renders the vietnamese current-step label', () => {
    render(<FlightStepper active={3} />)
    expect(screen.getByText('Bước 4/7 — Bàn giao')).toBeTruthy()
    expect(
      screen.getByRole('listitem', { name: /Bàn giao — Đang thực hiện/ }),
    ).toHaveAttribute('aria-current', 'step')
  })

  it('renders the english current-step label when language is switched', () => {
    render(<FlightStepper active={3} />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Step 4 of 7 — Handover')).toBeTruthy()
  })
})
