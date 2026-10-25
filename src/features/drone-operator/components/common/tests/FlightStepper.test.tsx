import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { FlightStepper } from '../FlightStepper'

describe('FlightStepper', () => {
  it('renders the vietnamese current-step label', () => {
    render(<FlightStepper active={4} />)
    expect(screen.getByText('Bàn giao')).toBeTruthy()
  })

  it('renders the english current-step label when language is switched', () => {
    render(<FlightStepper active={4} />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Handover')).toBeTruthy()
  })
})
