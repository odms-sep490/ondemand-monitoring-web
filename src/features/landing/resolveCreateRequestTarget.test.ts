import { describe, expect, it } from 'vitest'

import { resolveCreateRequestTarget } from './resolveCreateRequestTarget'
import type { UserProfile } from '../auth/types'

const userWith = (role: UserProfile['role']): UserProfile => ({
  id: '1',
  fullName: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
  role,
  isActive: true,
})

describe('resolveCreateRequestTarget', () => {
  it('sends a guest (no session) to login', () => {
    expect(resolveCreateRequestTarget(undefined)).toBe('#auth/login')
  })

  it('sends a CUSTOMER straight to the create-request screen', () => {
    expect(resolveCreateRequestTarget(userWith('CUSTOMER'))).toBe(
      '#portal/customer/request',
    )
  })

  it('sends a MANAGER user to their own role home, not the request form', () => {
    expect(resolveCreateRequestTarget(userWith('MANAGER'))).toBe(
      '#portal/manager',
    )
  })

  it('sends a STAFF user to their own role home', () => {
    expect(resolveCreateRequestTarget(userWith('STAFF'))).toBe('#portal/staff')
  })

  it('sends an ADMIN user to their own role home', () => {
    expect(resolveCreateRequestTarget(userWith('ADMIN'))).toBe('#portal/admin')
  })
})
