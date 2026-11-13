import { describe, expect, it } from 'vitest'

import { getRoleHomePath, getRoleHomeUrl, rememberProtectedRoute, redirectToRoleHome } from './routing'

describe('auth routing', () => {
  it('maps a customer to the customer portal', () => {
    expect(getRoleHomePath('CUSTOMER')).toBe('#portal/customer')
  })

  it('builds an absolute customer portal URL for OAuth callbacks', () => {
    expect(getRoleHomeUrl('CUSTOMER', 'http://localhost:5173')).toBe(
      'http://localhost:5173/#portal/customer',
    )
  })

  it('falls back to login when the social response has no role', () => {
    expect(getRoleHomeUrl(undefined, 'http://localhost:5173/')).toBe(
      'http://localhost:5173/#auth/login',
    )
  })

  it('returns to the customer order detail after signing in again', () => {
    rememberProtectedRoute('#portal/customer/orders/order-123')
    redirectToRoleHome('CUSTOMER')
    expect(window.location.hash).toBe('#portal/customer/orders/order-123')
    expect(window.sessionStorage.getItem('auth:return-to')).toBeNull()
  })

  it('does not send a different role to the saved customer page', () => {
    rememberProtectedRoute('#portal/customer/orders/order-123')
    redirectToRoleHome('MANAGER')
    expect(window.location.hash).toBe('#portal/manager')
  })
})
