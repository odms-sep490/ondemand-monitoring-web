import { describe, expect, it } from 'vitest'

import { buildConstructionChecklistWaypoints } from './planHelpers'

describe('construction checklist flight altitude', () => {
  it('uses the requested order altitude for the checklist orbit', () => {
    const waypoints = buildConstructionChecklistWaypoints(20)
    const checklistWaypoints = waypoints.filter((point) =>
      point.reason.startsWith('CHECKLIST_'),
    )

    expect(checklistWaypoints).toHaveLength(5)
    expect(checklistWaypoints.every((point) => point.altitudeM === 20)).toBe(
      true,
    )
  })
})
