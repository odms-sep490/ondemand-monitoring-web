import { describe, expect, it } from 'vitest'
import {
  maySendFlightCommand,
  missionMayTerminate,
  missionHasSafeStop,
  missionStopLabel,
} from './missionOperationalState'

describe('safe-stop dominates operational presentation', () => {
  const legacyMissions: Array<Parameters<typeof missionStopLabel>[0]> = [
    null,
    undefined,
    {},
    { status: 'FUTURE_STATUS' },
  ]
  it.each(legacyMissions)(
    'tolerates absent and legacy Mission data: %s',
    (mission) => {
      expect(missionHasSafeStop(mission)).toBe(false)
      expect(missionStopLabel(mission)).toBeNull()
      expect(missionMayTerminate(mission, true)).toBe(false)
    },
  )
  it('stale termination capability cannot reopen confirmed or cancelled missions', () => {
    expect(
      missionMayTerminate(
        {
          status: 'READY_TO_FLY',
          safeStopStatus: 'IN_PROGRESS',
          safeStopConfirmedAt: 'now',
        },
        true,
      ),
    ).toBe(false)
    expect(
      missionMayTerminate(
        { status: 'CANCELLED', safeStopStatus: 'REQUESTED' },
        true,
      ),
    ).toBe(false)
  })
  it.each([
    [{ safeStopStatus: 'REQUESTED' }, 'Đang dừng an toàn'],
    [
      { safeStopStatus: 'IN_PROGRESS', safeStopConfirmedAt: 'now' },
      'Đã xác nhận an toàn',
    ],
    [{ safeStopCleanedAt: 'now' }, 'Sẵn sàng hủy'],
    [{ safeStopStatus: 'READY_FOR_CANCELLATION' }, 'Sẵn sàng hủy'],
    [{ safeStopStatus: 'FAILED' }, 'Dừng an toàn cần xử lý lại'],
    [{ status: 'CANCELLED', safeStopStatus: 'FAILED' }, 'Đã hủy'],
  ])(
    'projects termination without rewriting READY_TO_FLY',
    (metadata, label) => {
      expect(missionStopLabel({ status: 'READY_TO_FLY', ...metadata })).toBe(
        label,
      )
    },
  )
  it('uses any persisted stop marker and leaves normal missions alone', () => {
    expect(missionHasSafeStop({ safeStopRequestedAt: 'now' })).toBe(true)
    expect(missionStopLabel({ status: 'READY_TO_FLY' })).toBeNull()
  })
  it.each([
    'takeoff',
    'gps_target_start',
    'auto_plan_start',
    'photo',
    'forward',
  ])('blocks normal command %s during termination', (command) => {
    expect(maySendFlightCommand(command, false, true)).toBe(false)
  })
  it.each(['land', 'return_to_base', 'stop', 'emergency_stop'])(
    'keeps only termination command %s',
    (command) => {
      expect(maySendFlightCommand(command, false, true)).toBe(true)
      expect(maySendFlightCommand(command, false, false)).toBe(false)
    },
  )
})
