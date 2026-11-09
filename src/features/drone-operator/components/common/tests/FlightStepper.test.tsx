import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { FlightStepper } from '../FlightStepper'

describe('FlightStepper', () => {
  it('renders the vietnamese current-step label', () => {
    render(<FlightStepper active={4} />)
    expect(screen.getByText('Bước 5/8 — Bàn giao')).toBeTruthy()
    expect(
      screen.getByRole('listitem', { name: /Bàn giao — Đang thực hiện/ }),
    ).toHaveAttribute('aria-current', 'step')
  })

  it('renders the english current-step label when language is switched', () => {
    render(<FlightStepper active={4} />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Step 5 of 8 — Handover')).toBeTruthy()
  })
})
