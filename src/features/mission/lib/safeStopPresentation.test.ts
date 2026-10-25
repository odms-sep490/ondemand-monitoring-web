import { expect, it } from 'vitest'
import type { SafeStop } from '../../manager/types/planning'
import { ApiError } from '../../../shared/api/httpClient'
import {
  managerStopAction,
  hasStopRequest,
  safeStopError,
  safeStopFailure,
  safeStopPhase,
} from './safeStopPresentation'

const stop: SafeStop = {
  missionId: 'm',
  status: null,
  requestedAt: null,
  confirmedAt: null,
  cleanedAt: null,
  failureReason: null,
  requiresLanding: false,
}
it.each([null, undefined])(
  'missing safe-stop response never throws or grants an action: %s',
  (missing) => {
    expect(safeStopPhase(missing)).toBe('unknown')
    expect(hasStopRequest(missing)).toBe(false)
    expect(managerStopAction(missing)).toBeNull()
  },
)
it('legacy response without capabilities does not grant actions', () => {
  expect(managerStopAction({ missionId: 'm' } as SafeStop)).toBeNull()
})
it('uses authoritative timestamps without introducing new API states', () => {
  expect(
    safeStopPhase({
      ...stop,
      status: 'IN_PROGRESS',
      confirmedAt: '2026-10-10',
    }),
  ).toBe('confirmed')
  expect(
    safeStopPhase({ ...stop, status: 'IN_PROGRESS', cleanedAt: '2026-10-10' }),
  ).toBe('cleaned')
  expect(
    safeStopPhase({ ...stop, status: 'FAILED', confirmedAt: '2026-10-10' }),
  ).toBe('failed')
  expect(
    safeStopPhase({ ...stop, status: 'FUTURE_STATUS' as SafeStop['status'] }),
  ).toBe('unknown')
})
it('chooses at most one action and does not infer missing capabilities', () => {
  expect(
    managerStopAction({ ...stop, status: 'READY_FOR_CANCELLATION' }),
  ).toBeNull()
  expect(
    managerStopAction({
      ...stop,
      status: 'IN_PROGRESS',
      confirmedAt: '2026-10-10',
    }),
  ).toBeNull()
  expect(managerStopAction({ ...stop, canRequestSafeStop: true })).toBe(
    'request',
  )
  expect(
    managerStopAction({
      ...stop,
      status: 'REQUESTED',
      canRequestSafeStop: true,
    }),
  ).toBeNull()
  expect(
    managerStopAction({
      ...stop,
      canRequestSafeStop: true,
      canCleanupSafeStop: true,
    }),
  ).toBe('cleanup')
  expect(
    managerStopAction({
      ...stop,
      canRequestSafeStop: true,
      canCleanupSafeStop: true,
      canCancelMission: true,
    }),
  ).toBe('cancel')
  expect(
    managerStopAction({
      ...stop,
      status: 'READY_FOR_CANCELLATION',
      cleanedAt: '2026-10-10',
      canCleanupSafeStop: true,
    }),
  ).toBeNull()
})
it('maps known errors and withholds unknown server diagnostics', () => {
  expect(safeStopFailure('MISSION_SAFE_STOP_FAILED')).toContain('Chưa hoàn tất')
  expect(safeStopFailure('PRIVATE_BACKEND_ERROR')).not.toContain(
    'PRIVATE_BACKEND_ERROR',
  )
  expect(
    safeStopError(
      new ApiError('private message', {
        code: 'ACCESS_DENIED',
        status: 403,
        path: '/stop',
        method: 'POST',
      }),
    ),
  ).toBe('Bạn không có quyền thực hiện thao tác này.')
  expect(safeStopError(new Error('private connection'))).not.toContain(
    'private connection',
  )
})
