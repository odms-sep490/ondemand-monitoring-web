import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { parseCustomerRoute } from './routes'

import { resetMockDb } from '../../mocks/db'
import '../../mocks/index'
import { setLanguage } from '../../shared/i18n'
import { CustomerApp } from './CustomerApp'

beforeEach(() => {
  resetMockDb()
  window.location.hash = '#portal/customer'
})
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

describe('CustomerApp', () => {
  it('renders the Vietnamese dashboard breadcrumb', async () => {
    render(<CustomerApp />)
    expect((await screen.findAllByText('Tổng quan')).length).toBeGreaterThan(0)
  })

  it('renders the English dashboard breadcrumb when language is switched', async () => {
    render(<CustomerApp />)
    await screen.findAllByText('Tổng quan')
    act(() => setLanguage('en'))
    expect((await screen.findAllByText('Overview')).length).toBeGreaterThan(0)
  })

  it('routes the customer notification bookmark to the notification center', async () => {
    window.location.hash = '#portal/customer/notifications'
    render(<CustomerApp />)
    expect(
      await screen.findByRole('heading', { name: 'Thông báo' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Thông báo' }),
    ).toBeInTheDocument()
    expect(parseCustomerRoute('#portal/customer/notifications')).toEqual({
      screen: 'notifications',
    })
  })
})
