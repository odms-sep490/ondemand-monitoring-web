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

  it('hides media notifications and resolves old notification bookmarks to the result library', async () => {
    render(<CustomerApp />)
    await screen.findAllByText('Tổng quan')
    expect(
      screen.queryByRole('link', { name: 'Thông báo' }),
    ).not.toBeInTheDocument()
    expect(parseCustomerRoute('#portal/customer/notifications')).toEqual({
      screen: 'mediaLibrary',
    })
  })
})
