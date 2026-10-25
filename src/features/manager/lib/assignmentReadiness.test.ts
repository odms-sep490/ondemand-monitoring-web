import { expect, it } from 'vitest'
import {
  assignmentReadiness,
  requiredAssignmentRoles,
} from './assignmentReadiness'
import { finalizeError } from './planningErrors'
import { ApiError } from '../../../shared/api/httpClient'
const crew = requiredAssignmentRoles.map((assignedRole) => ({
  staffId: assignedRole,
  assignedRole,
  responseStatus: 'PENDING',
}))
it('distinguishes submission from crew acceptance and excludes rejected assignments', () => {
  expect(
    assignmentReadiness({
      status: 'RESOURCE_ASSIGNING',
      deviceId: 'd',
      staffAssignments: crew,
    }),
  ).toMatchObject({ step: 'confirm', complete: false, needsSetup: true })
  expect(
    assignmentReadiness({
      status: 'WAITING_CREW_CONFIRMATION',
      deviceId: 'd',
      staffAssignments: crew,
    }),
  ).toMatchObject({ complete: true, needsSetup: false })
  expect(
    assignmentReadiness({
      status: 'WAITING_CREW_CONFIRMATION',
      deviceId: 'd',
      staffAssignments: crew.map((person, i) =>
        i === 0 ? { ...person, responseStatus: 'REJECTED' } : person,
      ),
    }).step,
  ).toBe('staff')
  expect(assignmentReadiness({ status: 'COMPLETED' }).needsSetup).toBe(false)
})
it.each([
  [
    'EXECUTION_PLAN_REVISION_CONFLICT',
    'Kế hoạch đã được thay đổi ở phiên bản khác. Vui lòng tải lại dữ liệu.',
  ],
  ['ORDER_NOT_APPROVED', 'Order chưa ở trạng thái cho phép chốt kế hoạch.'],
  ['UNKNOWN_RAW_CODE', 'Không thể chốt kế hoạch. Vui lòng thử lại.'],
])(
  'localizes finalize error %s but preserves diagnostic code',
  (code, message) => {
    const error = new ApiError(code, {
      code,
      method: 'POST',
      path: '/finalize',
    })
    expect(finalizeError(error)).toBe(message)
    expect(error.code).toBe(code)
  },
)
