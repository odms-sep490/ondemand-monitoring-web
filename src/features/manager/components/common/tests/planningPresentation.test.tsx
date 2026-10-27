import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApiError } from '../../../../../shared/api/httpClient'
import { planningBlocker, planningError } from '../../../lib/planningErrors'
import { planningSchedule } from '../planningSchedule'
import { MissionPlanningCard } from '../../../pages/OrderReview/components/MissionPlanningCard'
import { PlanningHeader } from '../PlanningHeader'
import type { MissionResponse } from '../../../types/missions'
import type { ExecutionPlan } from '../../../types/planning'
import { ExecutionPlanSummary } from '../../../pages/OrderReview/components/ExecutionPlanSummary'

describe('planning product presentation', () => {
  const summary: ExecutionPlan = {
    orderId: 'o',
    planStatus: 'DRAFT',
    revision: 3,
    missions: [],
    coverage: {
      total: 0,
      covered: 0,
      uncovered: 0,
      repeated: 0,
      coverageReady: true,
      uncoveredItemIds: [],
    },
    blockers: ['ORDER_NOT_APPROVED', 'UNKNOWN_SERVER_CODE'],
  }
  it('keeps draft blockers in the read model without repeating them in the summary', () => {
    render(<ExecutionPlanSummary plan={summary} items={[]} />)
    expect(screen.queryByRole('list', { name: 'Finalize blockers' })).not.toBeInTheDocument()
    expect(screen.queryByText('ORDER_NOT_APPROVED')).not.toBeInTheDocument()
    expect(screen.queryByText('UNKNOWN_SERVER_CODE')).not.toBeInTheDocument()
    expect(summary.blockers).toEqual([
      'ORDER_NOT_APPROVED',
      'UNKNOWN_SERVER_CODE',
    ])
  })
  it('does not show irrelevant finalization blockers on an already finalized historical plan', () => {
    render(
      <ExecutionPlanSummary
        plan={{ ...summary, planStatus: 'FINALIZED' }}
        items={[]}
      />,
    )
    expect(
      screen.queryByRole('list', { name: 'Finalize blockers' }),
    ).not.toBeInTheDocument()
  })
  it('has one concise heading and localized finalized badge', () => {
    render(<PlanningHeader status="FINALIZED" revision={3} />)
    expect(screen.getAllByRole('heading')).toHaveLength(1)
    expect(
      screen.getByRole('heading', { name: 'Kế hoạch thực thi' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Đã chốt')).toHaveClass('ui-badge')
    expect(screen.queryByText('FINALIZED')).not.toBeInTheDocument()
  })
  it('separates device and localized personnel rows on a historical card', () => {
    const mission = {
      id: 'm1',
      missionCode: 'MS-88508',
      status: 'COMPLETED',
      deviceName: 'Drone khảo sát',
      deviceCode: 'DRN-0052',
      scheduledStartAt: '2026-10-09T00:55:00Z',
      scheduledEndAt: '2026-10-09T03:55:00Z',
      staffAssignments: [
        { id: 'crew1', staffName: 'Nguyễn Minh', assignedRole: 'PILOT' },
        { id: 'crew2', staffName: 'Trần An', assignedRole: 'INSPECTOR' },
      ],
    } as unknown as MissionResponse
    render(
      <MissionPlanningCard
        mission={mission}
        scope={{
          missionId: 'm1',
          scopeLabel: 'Khu A',
          assignmentCount: 0,
          finalizedPlanRevision: 3,
        }}
        missions={[mission]}
      >
        Checklist
      </MissionPlanningCard>,
    )
    expect(screen.getByText('Hoàn thành')).toHaveClass('ui-badge')
    expect(screen.getByText('09/10/2026 · 07:55–10:55')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Thiết bị' })).toHaveTextContent(
      'Drone khảo sát',
    )
    expect(screen.getByRole('region', { name: 'Nhân sự' })).toHaveTextContent(
      'Phi côngNguyễn Minh',
    )
    expect(screen.getByText('Nghiệm thu')).toBeInTheDocument()
    expect(screen.queryByText('PILOT')).not.toBeInTheDocument()
    expect(screen.queryByText('INSPECTOR')).not.toBeInTheDocument()
    expect(screen.queryByText('COMPLETED')).not.toBeInTheDocument()
  })
  it('formats cross-day, partial and invalid schedules safely in the business timezone', () => {
    expect(
      planningSchedule('2026-10-09T16:30:00Z', '2026-10-09T18:00:00Z'),
    ).toBe('09/10/2026 · 23:30 — 10/10/2026 · 01:00')
    expect(planningSchedule('bad', null)).toBe('Chưa có lịch')
    expect(planningSchedule('2026-10-09T00:55:00Z', null)).toBe(
      '09/10/2026 · 07:55–…',
    )
  })
  it('maps known and unknown raw codes without mutating diagnostics', () => {
    const error = new ApiError('ORDER_NOT_APPROVED', {
      code: 'ORDER_NOT_APPROVED',
      method: 'POST',
      path: '/test',
    })
    expect(planningError(error)).toBe(
      'Đơn hàng chưa ở trạng thái cho phép chốt kế hoạch.',
    )
    expect(error.code).toBe('ORDER_NOT_APPROVED')
    expect(
      planningBlocker('CHECKLIST_EXECUTION_INTEGRITY_INVALID:raw-mission-id'),
    ).not.toMatch(/CHECKLIST_EXECUTION|raw-mission-id/)
    expect(planningBlocker('UNKNOWN_RAW_CODE')).not.toContain(
      'UNKNOWN_RAW_CODE',
    )
  })
})
