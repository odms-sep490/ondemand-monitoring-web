import type { ComponentProps } from 'react'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../../../shared/api/httpClient'
import type {
  EvidenceBlockingReason,
  MissionChecklistResponse,
} from '../../../../mission/types/checklistExecution'
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

describe('Mission result review card', () => {
  it('groups summary, readiness and actions with localized status and enabled approval', () => {
    card()
    const review = screen.getByRole('region', { name: 'Kết quả nhiệm vụ' })
    expect(within(review).getByText('Hoàn thành')).toBeInTheDocument()
    expect(within(review).getByText('Chờ duyệt')).toBeInTheDocument()
    expect(within(review).getByText('30 phút')).toBeInTheDocument()
    expect(within(review).getByText('2 ảnh/video')).toBeInTheDocument()
    expect(within(review).getByText(result.summary!)).toBeInTheDocument()
    expect(
      within(review).getByText('Mission đã hoàn thành'),
    ).toBeInTheDocument()
    expect(
      within(review).getByText('Checklist đã sẵn sàng'),
    ).toBeInTheDocument()
    expect(within(review).getByText('Có media')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Duyệt kết quả' })).toBeEnabled()
    expect(screen.queryByText(/COMPLETED|PENDING_MANAGER_APPROVAL/)).toBeNull()
    expect(
      screen
        .getAllByRole('button')
        .slice(-2)
        .map((button) => button.textContent),
    ).toEqual(['Từ chối kết quả', 'Duyệt kết quả'])
  })

  it('blocks known pending evidence media without making an approval request', () => {
    const approve = vi.spyOn(missionsApi, 'approveMissionResult')
    card({
      checklist: {
        ...checklist,
        readyForFinalApproval: false,
        blockingReasons: ['MEDIA_APPROVAL_REQUIRED'],
      },
    })
    const button = screen.getByRole('button', { name: 'Duyệt kết quả' })
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleDescription(
      'Cần duyệt toàn bộ media trước khi duyệt kết quả.',
    )
    expect(screen.getByText('Còn media chưa được duyệt')).toBeInTheDocument()
    expect(screen.getByText('Checklist đã sẵn sàng')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Từ chối kết quả' }),
    ).toBeEnabled()
    fireEvent.click(button)
    expect(approve).not.toHaveBeenCalled()
    expect(screen.queryByText(/MEDIA_APPROVAL_REQUIRED/)).toBeNull()
  })

  it.each([
    ['EXECUTION_NOT_TERMINAL', 'Checklist chưa hoàn tất.'],
    ['INSUFFICIENT_EVIDENCE', 'Checklist chưa đủ bằng chứng.'],
    ['UNABLE_REASON_REQUIRED', 'Cần bổ sung lý do'],
    ['MEDIA_REJECTED', 'Media bị từ chối.'],
    ['MEDIA_NOT_VALIDATED', 'Media đang được kiểm tra.'],
    ['EVIDENCE_SOURCE_NOT_ELIGIBLE', 'Bằng chứng chưa phù hợp.'],
    ['CHECKLIST_INTEGRITY_INVALID', 'Không thể xác nhận checklist.'],
  ] as Array<[EvidenceBlockingReason, string]>)(
    'presents a human-readable reason for %s',
    (reason, copy) => {
      card({
        checklist: {
          ...checklist,
          readyForSubmission: false,
          readyForFinalApproval: false,
          blockingReasons: [],
          executions: [
            { blockingReasons: [reason] },
          ] as MissionChecklistResponse['executions'],
        },
      })
      expect(
        screen.getByRole('button', { name: 'Duyệt kết quả' }),
      ).toBeDisabled()
      expect(screen.getByRole('status')).toHaveTextContent(copy)
      expect(screen.queryByText(reason)).toBeNull()
    },
  )

  it('blocks missing readiness without leaking sibling checklist state', () => {
    card({ checklist: { ...checklist, missionId: 'm2' } })
    expect(screen.getByRole('button', { name: 'Duyệt kết quả' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Chưa xác nhận được điều kiện duyệt.',
    )
  })
  it.each([
    { checklistLoading: true },
    { checklistFailed: true },
    { refreshing: true },
  ])('fails closed during load/error/refresh: %j', (state) => {
    card(state)
    expect(screen.getByRole('button', { name: 'Duyệt kết quả' })).toBeDisabled()
  })
  it('requires the existing completed-Mission approval condition', () => {
    card({ mission: { id: 'm1', status: 'PENDING_REVIEW' } })
    expect(screen.getByRole('button', { name: 'Duyệt kết quả' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Mission chưa hoàn thành.',
    )
  })
  it('does not introduce a media-count requirement for an empty ready checklist', () => {
    card({ result: { ...result, mediaCount: 0 } })
    expect(screen.getByText('Chưa có media')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Duyệt kết quả' })).toBeEnabled()
  })
  it('does not override canonical readiness using optional media blocking hints', () => {
    card({
      checklist: { ...checklist, blockingReasons: ['MEDIA_APPROVAL_REQUIRED'] },
    })
    expect(screen.getByRole('button', { name: 'Duyệt kết quả' })).toBeEnabled()
    expect(screen.queryByText('Còn media chưa được duyệt')).toBeNull()
  })
  it('approves the exact result and never implicitly approves media', async () => {
    const approve = vi
      .spyOn(missionsApi, 'approveMissionResult')
      .mockResolvedValue(result)
    const media = vi.spyOn(missionsApi, 'approveMissionMedia')
    const refresh = vi.fn()
    card({ onReviewed: refresh })
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt kết quả' }))
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    expect(approve).toHaveBeenCalledWith('result-1', '')
    expect(media).not.toHaveBeenCalled()
  })
  it('renders the full-width optional rejection note and keeps rejection unchanged', async () => {
    const reject = vi
      .spyOn(missionsApi, 'rejectMissionResult')
      .mockResolvedValue(result)
    const refresh = vi.fn()
    card({ onReviewed: refresh })
    const note = screen.getByRole('textbox', { name: 'Ghi chú / lý do' })
    expect(note).toHaveAttribute('rows', '3')
    fireEvent.change(note, {
      target: { value: 'Cần chụp lại khu vực phía Bắc.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối kết quả' }))
    await waitFor(() =>
      expect(reject).toHaveBeenCalledWith(
        'result-1',
        'Cần chụp lại khu vực phía Bắc.',
      ),
    )
    expect(refresh).toHaveBeenCalledOnce()
    expect(note).toHaveValue('')
  })
  it('shows the compact media helper and invokes in-page navigation without touching review APIs', () => {
    const viewMedia = vi.fn(),
      approve = vi.spyOn(missionsApi, 'approveMissionResult')
    card({ onViewMedia: viewMedia })
    expect(
      screen.getByText('Duyệt media riêng trước khi duyệt kết quả.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xem thư viện media' }))
    expect(viewMedia).toHaveBeenCalledOnce()
    expect(approve).not.toHaveBeenCalled()
    expect(screen.queryByText(/Duyệt kết quả không tự động/)).toBeNull()
  })
  it.each([
    new ApiError('ORDER_NOT_APPROVED', {
      code: 'ORDER_NOT_APPROVED',
      status: 409,
      method: 'POST',
      path: '/api/mission-results/r/approve',
    }),
    new Error('TypeError: unexpected server failure'),
  ])('never exposes raw API/JS errors in the primary UI', async (error) => {
    vi.spyOn(missionsApi, 'approveMissionResult').mockRejectedValue(error)
    card()
    fireEvent.click(screen.getByRole('button', { name: 'Duyệt kết quả' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể duyệt hoặc từ chối kết quả. Vui lòng thử lại.',
    )
    expect(screen.queryByText(error.message)).toBeNull()
  })
  it('keeps recorded rejection reasons read-only', () => {
    card({
      result: {
        ...result,
        approvalStatus: 'REJECTED',
        reviewNote: 'Ảnh chưa rõ.',
      },
    })
    expect(screen.getByText('Lý do từ chối')).toBeInTheDocument()
    expect(screen.getByText('Ảnh chưa rõ.')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Duyệt kết quả' })).toBeNull()
  })
  it('never displays or reviews a sibling result', () => {
    card({ result: { ...result, missionId: 'm2', summary: 'Sibling summary' } })
    expect(
      screen.getByText('Chưa có kết quả nhiệm vụ được gửi.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Sibling summary')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Duyệt kết quả' })).toBeNull()
  })
})
