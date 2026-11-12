import { describe, expect, it } from 'vitest'

import { ApiError } from '../../../shared/api/httpClient'
import { setLanguage } from '../../../shared/i18n'
import { planningError, resourceAssignmentConflict } from './planningErrors'

const busyError = new ApiError('Nhân viên đã đăng ký bận trong khung giờ này', {
  status: 409,
  code: 'STAFF_BUSY_IN_SLOT',
  method: 'POST',
  path: '/api/missions/m1/staff-assignments',
})

describe('STAFF_BUSY_IN_SLOT', () => {
  it('is an assignment conflict mapped to a dedicated localized message', () => {
    setLanguage('vi')
    expect(resourceAssignmentConflict(busyError)).toBe(true)
    expect(planningError(busyError)).toMatch(/đã đăng ký bận/)
    setLanguage('en')
    expect(planningError(busyError)).toMatch(/registered as busy/)
    setLanguage('vi')
  })
})
