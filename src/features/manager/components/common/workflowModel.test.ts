import { describe, expect, it } from 'vitest'

import {
  MISSION_PLANNING_STAGES,
  MISSION_STAGES,
  missionProgress,
} from './workflowModel'

describe('Mission workflow', () => {
  it('shows flight permit as step 2 before execution and completion', () => {
    expect(MISSION_STAGES).toEqual([
      'permit',
      'execute',
      'done',
    ])
    expect(MISSION_PLANNING_STAGES).toEqual([
      'permit',
      'execute',
    ])
    expect(missionProgress('READY').current).toBe('permit')
    expect(missionProgress('PENDING_APPROVAL').current).toBe('permit')
  })

  it('does not jump back to preparation after a permit is approved', () => {
    expect(
      missionProgress('READY', 'APPROVED').current,
    ).toBe('execute')
  })
})
