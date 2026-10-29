import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { CreateOrderPage } from '../CreateOrderPage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('CreateOrderPage', () => {
  it('renders the Vietnamese page title', async () => {
    render(<CreateOrderPage />)
    expect(await screen.findByText('Tạo yêu cầu giám sát')).toBeTruthy()
  })

  it('renders the English page title when language is switched', async () => {
    render(<CreateOrderPage />)
    await screen.findByText('Tạo yêu cầu giám sát')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Create monitoring request')).toBeTruthy()
  })
})
