import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { MaintenancePage } from '../MaintenancePage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('MaintenancePage', () => {
  it('renders the page title', () => {
    render(<MaintenancePage />)
    expect(screen.getByText('Quản lý Ticket & Phân công Bảo trì')).toBeTruthy()
  })

  it('shows loading state initially', () => {
    const { container } = render(<MaintenancePage />)
    const busy = container.querySelector('[aria-busy="true"]')
    const board = container.querySelector('[class*="odm-badge"]')
    expect(busy ?? board).toBeTruthy()
  })

  it('has a create ticket button', () => {
    render(<MaintenancePage />)
    expect(screen.getByText('+ Tạo ticket')).toBeTruthy()
  })

  it('shows the English create-ticket button when language is switched', () => {
    render(<MaintenancePage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('+ New ticket')).toBeTruthy()
  })
})
