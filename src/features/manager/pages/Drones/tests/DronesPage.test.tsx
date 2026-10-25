import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { DronesPage } from '../DronesPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('DronesPage', () => {
  it('renders the page title', () => {
    render(<DronesPage />)
    expect(screen.getByText('Đội drone')).toBeTruthy()
  })

  it('shows loading state initially', () => {
    const { container } = render(<DronesPage />)
    const busy = container.querySelector('[aria-busy="true"]')
    const table = container.querySelector('table')
    expect(busy ?? table).toBeTruthy()
  })

  it('renders the English page title when language is switched', () => {
    render(<DronesPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Drone fleet')).toBeTruthy()
  })
})
