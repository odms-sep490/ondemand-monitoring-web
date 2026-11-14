import type { ComponentProps } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MissionChecklistResponse } from '../../../../mission/types/checklistExecution'
import { missionsApi } from '../../../api/missionsApi'
import type { MissionResultResponse } from '../../../types/missions'
import { MissionResultReviewCard } from '../MissionResultReviewCard'

afterEach(() => vi.restoreAllMocks())
const result: MissionResultResponse = {
  id: 'result-1',
  missionId: 'm1',
  missionCode: 'MS-88508',
  status: 'COMPLETED',
  approvalStatus: 'PENDING_MANAGER_APPROVAL',
  submittedAt: '2026-10-09T01:00:00Z',
  durationSeconds: 1800,
  mediaCount: 2,
  summary: 'Đã quan sát toàn bộ khu vực theo yêu cầu.',
  startedAt: null,
  endedAt: null,
  completedAt: null,
  approvedAt: null,
  rejectedAt: null,
  notes: null,
  createdBy: null,
  reviewedBy: null,
  reviewNote: null,
  createdAt: null,
  updatedAt: null,
  mediaFiles: [],
}
const checklist: MissionChecklistResponse = {
  missionId: 'm1',
  legacySnapshot: false,
  readyForSubmission: true,
  readyForFinalApproval: true,
  executions: [],
}
function card(
  props: Partial<ComponentProps<typeof MissionResultReviewCard>> = {},
) {
  return render(
    <MissionResultReviewCard
      mission={{ id: 'm1', status: 'COMPLETED' }}
      result={result}
      checklist={checklist}
      onReviewed={vi.fn()}
      onViewMedia={vi.fn()}
      {...props}
    />,
  )
}

describe('Manager result monitoring is read-only', () => {
  it.each([
    'DRAFT',
    'PENDING_MANAGER_APPROVAL',
    'APPROVED',
    'REJECTED',
  ] as const)(
    'never offers Manager approval or rejection for %s',
    (approvalStatus) => {
      const approve = vi.spyOn(missionsApi, 'approveMissionResult')
      const reject = vi.spyOn(missionsApi, 'rejectMissionResult')
      card({ result: { ...result, approvalStatus } })
      expect(screen.queryByRole('button', { name: 'Duyệt kết quả' })).toBeNull()
      expect(
        screen.queryByRole('button', { name: 'Từ chối kết quả' }),
      ).toBeNull()
      expect(screen.queryByRole('textbox')).toBeNull()
      expect(
        screen.queryByText(/PENDING_MANAGER_APPROVAL|APPROVED|REJECTED/),
      ).toBeNull()
      expect(approve).not.toHaveBeenCalled()
      expect(reject).not.toHaveBeenCalled()
    },
  )
  it('explains Inspector publication and Manager customer-feedback responsibility', () => {
    card()
    expect(
      screen.getByText('Inspector phụ trách nghiệm thu'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Manager xử lý phản hồi và yêu cầu làm lại/),
    ).toBeInTheDocument()
    expect(screen.getByText('Chờ Inspector nghiệm thu')).toBeInTheDocument()
  })
  it('still shows actual readiness and lets Manager inspect the media library', () => {
    const view = vi.fn()
    card({ onViewMedia: view })
    const review = screen.getByRole('region', { name: 'Kết quả nhiệm vụ' })
    expect(within(review).getByText('Hoàn thành')).toBeInTheDocument()
    expect(within(review).getByText('Có ảnh/video')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Xem thư viện ảnh/video' }),
    )
    expect(view).toHaveBeenCalledOnce()
  })
  it('preserves a historical rejection reason as read-only content', () => {
    card({
      result: {
        ...result,
        approvalStatus: 'REJECTED',
        reviewNote: 'Ảnh bị mờ',
      },
    })
    expect(screen.getByText('Ảnh bị mờ')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
  })
  it('does not show a sibling mission result', () => {
    card({ result: { ...result, missionId: 'sibling' } })
    expect(
      screen.getByText('Chưa có kết quả nhiệm vụ được gửi.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Chờ Inspector nghiệm thu')).toBeNull()
  })
  it('does not grant approval when evidence is pending or readiness is unknown', () => {
    card({
      checklistFailed: true,
      checklist: {
        ...checklist,
        readyForFinalApproval: false,
        blockingReasons: ['MEDIA_APPROVAL_REQUIRED'],
      },
    })
    expect(screen.queryByRole('button', { name: 'Duyệt kết quả' })).toBeNull()
    expect(
      screen.getByText('Inspector phụ trách nghiệm thu'),
    ).toBeInTheDocument()
  })
})
