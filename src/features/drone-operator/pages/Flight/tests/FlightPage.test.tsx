import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { FlightPage } from '../FlightPage'

// Without a mission id (no route param, no active session), the screen
// stays on its "opening" shell synchronously.
describe('ActiveFlightScreen', () => {
  it('renders the vietnamese opening text', () => {
    render(<FlightPage />)
    expect(screen.getByText('Đang mở buồng lái...')).toBeTruthy()
  })

  it('renders the english opening text when language is switched', () => {
    render(<FlightPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Opening the cockpit...')).toBeTruthy()
  })
})
