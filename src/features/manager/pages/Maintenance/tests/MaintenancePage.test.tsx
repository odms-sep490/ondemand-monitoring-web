import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { MaintenancePage } from '../MaintenancePage'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('MaintenancePage', () => {
  it('renders the page title', () => {
    render(<MaintenancePage />)
    expect(screen.getByText('Quản lý phiếu & Phân công Bảo trì')).toBeTruthy()
  })

  it('shows loading state initially', () => {
    const { container } = render(<MaintenancePage />)
    const busy = container.querySelector('[aria-busy="true"]')
    const board = container.querySelector('[class*="odm-badge"]')
    expect(busy ?? board).toBeTruthy()
  })

  it('has no create-ticket button (backend has no POST endpoint)', () => {
    render(<MaintenancePage />)
    expect(screen.queryByText('+ Tạo ticket')).toBeNull()
  })
})
