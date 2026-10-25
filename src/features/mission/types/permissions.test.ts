import { describe, expect, it } from 'vitest'
import {
  mayPerformMissionAction,
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
