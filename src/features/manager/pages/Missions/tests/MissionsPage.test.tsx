import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { MissionsPage } from '../MissionsPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('MissionsListPage', () => {
  it('renders loading state', () => {
    const { container } = render(<MissionsPage />)
    // The loading skeleton or aria-busy
    const busy = container.querySelector('[aria-busy="true"]')
    // Page title should be present
    expect(screen.getByText('Nhiệm vụ')).toBeTruthy()
    // Either loading indicator or data should be present
    expect(busy ?? container.querySelector('table')).toBeTruthy()
  })

  it('renders the English page title when language is switched', () => {
    render(<MissionsPage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Missions')).toBeTruthy()
  })
})
