import { ApiError } from '../../../shared/api/httpClient'
import type { SafeStop } from '../../manager/types/planning'

export type SafeStopPhase =
  | 'notRequested'
  | 'requested'
  | 'inProgress'
  | 'confirmed'
  | 'cleaned'
  | 'failed'
  | 'unknown'

// Presentation only: confirmation is a timestamp, not a new backend state.
export function safeStopPhase(
  stop: SafeStop | null | undefined,
): SafeStopPhase {
  if (!stop) return 'unknown'
  if (stop.status === 'FAILED') return 'failed'
  if (stop.cleanedAt || stop.status === 'READY_FOR_CANCELLATION')
    return 'cleaned'
  if (stop.confirmedAt) return 'confirmed'
  if (stop.status === 'IN_PROGRESS') return 'inProgress'
  if (stop.status === 'REQUESTED' || (!stop.status && stop.requestedAt))
    return 'requested'
  return stop.status ? 'unknown' : 'notRequested'
}

export function hasStopRequest(stop: SafeStop | null | undefined): boolean {
  return Boolean(
    stop?.status || stop?.requestedAt || stop?.confirmedAt || stop?.cleanedAt,
  )
}

/** Choose one next action from explicit capabilities, never grant permission by phase. */
export function managerStopAction(
  stop: SafeStop | null | undefined,
): 'request' | 'cleanup' | 'cancel' | null {
  if (!stop) return null
  if (stop.canCancelMission === true) return 'cancel'
  if (stop.canCleanupSafeStop === true && !stop.cleanedAt) return 'cleanup'
  if (stop.canRequestSafeStop === true && !hasStopRequest(stop))
    return 'request'
  return null
}

const errorCopy: Record<string, string> = {
  ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
  UNAUTHORIZED: 'Vui lòng đăng nhập lại để tiếp tục.',
  INVALID_REQUEST: 'Kiểm tra thông tin xác nhận và thử lại.',
  EXECUTION_PLAN_REVISION_CONFLICT:
    'Kế hoạch đã thay đổi. Làm mới trạng thái trước khi tiếp tục.',
  EXECUTION_PLAN_NOT_DRAFT:
    'Cần mở điều chỉnh kế hoạch trước khi tiếp tục hủy Mission.',
  EXECUTION_PLAN_NOT_FINALIZED:
    'Chỉ có thể hủy Mission khi kế hoạch thực hiện đã được chốt (Finalized).',
  MISSION_SAFE_STOP_NOT_READY:
    'Mission chưa ở trạng thái an toàn để tiếp tục. Làm mới trạng thái hoặc liên hệ đội bay.',
  MISSION_SAFE_STOP_FAILED:
    'Chưa hoàn tất dừng an toàn. Liên hệ đội bay và làm mới trạng thái để tiếp tục.',
  MISSION_CANCELLATION_REQUIRES_SAFE_STOP:
    'Cần hoàn tất dừng an toàn trước khi hủy Mission.',
  MISSION_CANCELLATION_NOT_ALLOWED:
    'Mission chưa đủ điều kiện hủy. Làm mới trạng thái để kiểm tra lại.',
  MISSION_RESULT_ALREADY_APPROVED:
    'Kết quả đã được duyệt; không thể hủy Mission này.',
}

export function safeStopFailure(reason: string | null): string {
  // Keep arbitrary server diagnostics out of the operational presentation.
  return (
    errorCopy[reason ?? ''] ??
    'Chưa hoàn tất dừng an toàn. Liên hệ đội bay và làm mới trạng thái để kiểm tra lại.'
  )
}

export function safeStopError(error: unknown): string {
  return error instanceof ApiError
    ? (errorCopy[error.code ?? ''] ??
        'Chưa thể thực hiện thao tác. Làm mới trạng thái hoặc liên hệ hỗ trợ.')
    : 'Không thể tải trạng thái lúc này. Vui lòng thử lại.'
}

export const safeStopCopy = {
  staff: {
    notRequested: ['Chưa có yêu cầu', 'Manager chưa yêu cầu dừng Mission.'],
    requested: [
      'Đã yêu cầu dừng',
      'Đưa Mission về trạng thái an toàn, sau đó xác nhận khi đã hoàn tất.',
    ],
    inProgress: [
      'Đang xử lý',
      'Hoàn tất các thao tác an toàn trước khi xác nhận.',
    ],
    confirmed: [
      'Đã xác nhận an toàn',
      'Đang chờ Manager giải phóng tài nguyên.',
    ],
    cleaned: [
      'Đã hoàn tất dừng an toàn',
      'Tài nguyên đã được giải phóng. Không cần xác nhận thêm.',
    ],
    failed: [
      'Cần xử lý lại',
      'Kiểm tra lại tình trạng an toàn của Mission và liên hệ Manager.',
    ],
    unknown: [
      'Cần kiểm tra trạng thái',
      'Làm mới trạng thái trước khi tiếp tục.',
    ],
  },
  manager: {
    notRequested: [
      'Chưa yêu cầu dừng',
      'Mission cần được đưa về trạng thái an toàn trước khi có thể hủy.',
    ],
    requested: [
      'Đã yêu cầu dừng',
      'Đang chờ đội bay đưa Mission về trạng thái an toàn và xác nhận.',
    ],
    inProgress: [
      'Đang xử lý',
      'Đội bay đang đưa Mission về trạng thái an toàn.',
    ],
    confirmed: [
      'Đã xác nhận an toàn',
      'Đội bay đã xác nhận Mission ở trạng thái an toàn.',
    ],
    cleaned: [
      'Sẵn sàng hủy',
      'Tài nguyên vận hành đã được giải phóng. Mission hiện có thể được hủy an toàn.',
    ],
    failed: [
      'Cần xử lý lại',
      'Kiểm tra tình trạng Mission với đội bay trước khi tiếp tục.',
    ],
    unknown: [
      'Cần kiểm tra trạng thái',
      'Làm mới trạng thái trước khi tiếp tục.',
    ],
  },
} as const
