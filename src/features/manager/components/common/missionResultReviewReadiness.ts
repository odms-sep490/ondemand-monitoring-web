import { ApiError } from '../../../../shared/api/httpClient'
import type {
  EvidenceBlockingReason,
  MissionChecklistResponse,
} from '../../../mission/types/checklistExecution'

const reasons: Record<EvidenceBlockingReason, string> = {
  MEDIA_APPROVAL_REQUIRED: 'Cần duyệt toàn bộ media trước khi duyệt kết quả.',
  MEDIA_REJECTED: 'Media bị từ chối. Cần bổ sung bằng chứng phù hợp.',
  MEDIA_NOT_VALIDATED:
    'Media đang được kiểm tra. Vui lòng chờ trước khi duyệt kết quả.',
  INSUFFICIENT_EVIDENCE:
    'Checklist chưa đủ bằng chứng. Cần bổ sung trước khi duyệt kết quả.',
  EXECUTION_NOT_TERMINAL:
    'Checklist chưa hoàn tất. Cần hoàn tất các mục trước khi duyệt kết quả.',
  EXECUTION_NOT_COMPLETED:
    'Checklist chưa hoàn tất. Cần hoàn tất các mục trước khi duyệt kết quả.',
  UNABLE_REASON_REQUIRED:
    'Cần bổ sung lý do cho mục checklist chưa thể xác minh.',
  CHECKLIST_INTEGRITY_INVALID:
    'Không thể xác nhận checklist. Vui lòng tải lại.',
  EVIDENCE_SOURCE_NOT_ELIGIBLE:
    'Bằng chứng chưa phù hợp. Cần bổ sung ảnh/video phù hợp.',
  EVIDENCE_TYPE_NOT_ELIGIBLE:
    'Loại media chưa phù hợp. Cần bổ sung ảnh/video đúng loại yêu cầu.',
}

/** Present the canonical backend verdict; never reconstruct evidence eligibility or counts. */
export function missionResultReviewReadiness({
  missionId,
  missionStatus,
  checklist,
  loading = false,
  failed = false,
}: {
  missionId: string
  missionStatus: string
  checklist?: MissionChecklistResponse
  loading?: boolean
  failed?: boolean
}) {
  const matching =
    !loading && !failed && checklist?.missionId === missionId
      ? checklist
      : undefined
  const missionComplete = missionStatus === 'COMPLETED'
  const finalReady = matching?.readyForFinalApproval === true
  const checklistReady = matching?.readyForSubmission === true || finalReady
  const blockers = matching
    ? [
        ...(matching.blockingReasons ?? []),
        ...matching.executions.flatMap((item) => item.blockingReasons ?? []),
      ]
    : []
  // A pending optional/unrelated media file must not override the canonical verdict.
  const mediaPending =
    !finalReady && blockers.includes('MEDIA_APPROVAL_REQUIRED')
  const ready = missionComplete && finalReady
  let reason: string | null = null
  if (loading) reason = 'Đang kiểm tra điều kiện duyệt…'
  else if (!matching)
    reason = 'Chưa xác nhận được điều kiện duyệt. Vui lòng tải lại checklist.'
  else if (!missionComplete)
    reason =
      'Mission chưa hoàn thành. Chỉ duyệt kết quả sau khi Mission hoàn thành.'
  else if (!finalReady) {
    const blocker = mediaPending ? 'MEDIA_APPROVAL_REQUIRED' : blockers[0]
    reason =
      (blocker && reasons[blocker]) ||
      'Checklist chưa sẵn sàng. Kiểm tra các mục và bằng chứng trước khi duyệt kết quả.'
  }
  return {
    ready,
    reason,
    missionComplete,
    checklistReady,
    mediaPending,
    known: !!matching,
  }
}

/** Keep the original error object in action state; never render its API message/code. */
export function missionResultReviewErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
    if (error.status === 403) return 'Bạn không có quyền duyệt kết quả này.'
    if (error.status === 404 || error.code === 'RESOURCE_NOT_FOUND')
      return 'Kết quả không còn chờ duyệt. Vui lòng tải lại.'
    if (error.code === 'CHECKLIST_NOT_READY')
      return 'Checklist hoặc media chưa sẵn sàng. Vui lòng kiểm tra lại trước khi duyệt kết quả.'
    if (error.code === 'ORDER_MEDIA_QUANTITY_NOT_MET') return error.message
    if (error.code === 'MISSION_STATUS_INVALID')
      return 'Trạng thái Mission đã thay đổi. Vui lòng tải lại kết quả.'
    if (error.code === 'CONCURRENT_UPDATE')
      return 'Kết quả đã được cập nhật. Vui lòng tải lại trước khi tiếp tục.'
  }
  return 'Không thể duyệt hoặc từ chối kết quả. Vui lòng thử lại.'
}
