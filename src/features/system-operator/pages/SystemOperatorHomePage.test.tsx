import { act } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { SystemOperatorHomePage } from './SystemOperatorHomePage'

afterEach(() => {
  window.location.hash = ''
})

describe('SystemOperatorHomePage', () => {
  it('renders the Vietnamese devices banner title for the devices route', () => {
    window.location.hash = '#portal/staff/technical/devices'
    render(<SystemOperatorHomePage />)
    expect(
      screen.getByText('Trạng thái đội bay và thiết bị drone'),
    ).toBeInTheDocument()
  })

  it('renders the English devices banner title when language is switched', () => {
    window.location.hash = '#portal/staff/technical/devices'
    render(<SystemOperatorHomePage />)
    act(() => setLanguage('en'))
    expect(
      screen.getByText('Fleet and drone device status'),
    ).toBeInTheDocument()
  })
})
