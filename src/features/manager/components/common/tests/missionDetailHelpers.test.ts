import { describe, expect, it } from 'vitest'
import type { MissionStaffAssignmentResponse } from '../../../types/missions'
import { groupStaffAssignments } from '../missionDetailHelpers'

const assignment = (
  id: string,
  staffId: string,
  assignedRole: MissionStaffAssignmentResponse['assignedRole'],
): MissionStaffAssignmentResponse => ({
  id,
  staffId,
  staffName: 'Seed Staff 1',
  staffEmail: 'seed.drone@example.test',
  staffPhone: null,
  assignedRole,
  responseStatus: 'PENDING',
  assignedAt: null,
  respondedAt: null,
  declineReason: null,
})

describe('groupStaffAssignments', () => {
  it('counts one person once when they cover multiple roles', () => {
    const roles: MissionStaffAssignmentResponse['assignedRole'][] = [
      'PILOT',
      'OPERATOR',
      'MAINTAINER',
      'INSPECTOR',
    ]
    const groups = groupStaffAssignments(
      roles.map((role, index) =>
        assignment(`assignment-${index}`, 'staff-1', role),
      ),
    )

    expect(groups).toHaveLength(1)
    expect(groups[0].assignments).toHaveLength(4)
  })

  it('deduplicates role rows that identify the same person by email', () => {
    const groups = groupStaffAssignments([
      assignment('pilot', 'pilot-row', 'PILOT'),
      assignment('operator', 'operator-row', 'OPERATOR'),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].assignments.map((row) => row.assignedRole)).toEqual([
      'PILOT',
      'OPERATOR',
    ])
  })
})
