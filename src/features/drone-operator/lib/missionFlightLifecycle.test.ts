import { expect, it } from 'vitest'
import { hasMissionFlightEnded } from './missionFlightLifecycle'
import { actionFor } from '../pages/MissionList/missionTableHelpers'
import { missionListTableMessages } from '../pages/MissionList/components/MissionListTable.messages'
import type { OperatorMission } from '../types/mission'

it('recognizes closed physical flights without treating ongoing flights as finished', () => {
  expect(hasMissionFlightEnded({})).toBe(false)
  expect(hasMissionFlightEnded({ deviceAssignmentStatus: 'IN_FLIGHT' })).toBe(false)
  expect(hasMissionFlightEnded({ actualEndAt: '2026-11-16T10:20:00Z' })).toBe(true)
  expect(hasMissionFlightEnded({ deviceAssignmentStatus: 'POSTFLIGHT_CHECKING' })).toBe(true)
  expect(hasMissionFlightEnded({ deviceAssignmentStatus: 'COMPLETED' })).toBe(true)
})
it('never offers the cockpit for a closed flight even with stale control permissions', () => {
  const mission = { id: 'm', status: 'IN_FLIGHT', backendStatus: 'IN_PROGRESS', actualEndAt: '2026-11-16T10:20:00Z', permissions: { canControlFlight: true } } as OperatorMission
  expect(actionFor(mission, missionListTableMessages.vi).href).toBe('#portal/staff/missions/m')
})

it('retains the equipment postflight action until physical checks finish', () => {
  const mission = { id: 'm', status: 'IN_FLIGHT', backendStatus: 'IN_PROGRESS', deviceAssignmentStatus: 'POSTFLIGHT_CHECKING', permissions: { canControlFlight: true, canMaintainDevice: true } } as OperatorMission
  expect(actionFor(mission, missionListTableMessages.vi).href).toBe('#portal/staff/postflight/m')
})
