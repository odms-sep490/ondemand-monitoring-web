import { describe, expect, it } from 'vitest'
import {
  mayPerformMissionAction,
  hasInspectionWorkspaceAccess,
  type MissionAction,
  type MissionPermissions,
} from './permissions'

describe('missing capability fails closed', () => {
  it.each<MissionAction>([
    'connect',
    'handover',
    'flight',
    'preflight',
    'postflight',
    'upload',
  ])('does not grant %s on an absent/partial response', (action) => {
    expect(mayPerformMissionAction(null, action)).toBe(false)
    expect(mayPerformMissionAction(undefined, action)).toBe(false)
    expect(mayPerformMissionAction({} as MissionPermissions, action)).toBe(
      false,
    )
  })
})

it('lets the assigned Inspector open postflight and evidence without granting flight control', () => {
  const permission = { canAccessMissionInspection: true } as MissionPermissions
  expect(mayPerformMissionAction(permission, 'postflight')).toBe(true)
  expect(mayPerformMissionAction(permission, 'upload')).toBe(true)
  expect(mayPerformMissionAction(permission, 'flight')).toBe(false)
  expect(mayPerformMissionAction(permission, 'preflight')).toBe(false)
})

it('distinguishes workspace assignment from currently unlocked assessment', () => {
  expect(hasInspectionWorkspaceAccess({ canAccessMissionInspection: true, canAssessMonitoringChecklist: false } as MissionPermissions)).toBe(true)
  expect(hasInspectionWorkspaceAccess({ canAccessMissionInspection: false, canCompleteMission: true } as MissionPermissions)).toBe(false)
  expect(hasInspectionWorkspaceAccess(undefined)).toBe(false)
})
