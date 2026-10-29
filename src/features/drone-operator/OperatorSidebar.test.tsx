import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { setLanguage } from '../../shared/i18n'
import { OperatorSidebar } from './OperatorSidebar'
import { parseOperatorRoute } from './routes'

beforeEach(() => setLanguage('vi'))
afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('unified staff navigation', () => {
  it('uses grouped Vietnamese navigation and no standalone password link', () => {
    render(<OperatorSidebar route={{ screen: 'technical' }} />)
    const technical = screen.getByRole('link', { name: 'Tổng quan kỹ thuật' })
    expect(technical).toHaveAttribute('aria-current', 'page')
    expect(technical).toHaveClass('mgr-menu-link')
    expect(screen.getByRole('link', { name: 'Hỗ trợ khách hàng' })).toHaveClass(
      'mgr-menu-link',
    )
    expect(screen.queryByRole('link', { name: /Password|mật khẩu/ })).toBeNull()
  })
  it('routes support and technical screens through the staff workspace', () => {
    expect(parseOperatorRoute('#portal/staff/support')).toEqual({
      screen: 'support',
    })
    expect(parseOperatorRoute('#portal/staff/technical/devices')).toEqual({
      screen: 'devices',
    })
    expect(parseOperatorRoute('#portal/staff/technical/maintenance')).toEqual({
      screen: 'maintenance',
    })
    expect(parseOperatorRoute('#portal/staff/profile')).toEqual({
      screen: 'profile',
    })
  })
})
