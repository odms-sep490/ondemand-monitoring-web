import type { Language } from '../../../shared/i18n'
import type {
  OrderStatus,
  MissionStatus,
  StatusTone,
} from '../../../shared/types/domain'

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  DRAFT: 'gray',
  SUBMITTED: 'yellow',
  PENDING: 'yellow',
  UNDER_REVIEW: 'blue',
  NEEDS_INFO: 'orange',
  APPROVED: 'blue',
  SCHEDULED: 'blue',
  IN_PROGRESS: 'green',
  COMPLETED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
}

const ORDER_STATUS_LABEL_VI: Record<OrderStatus, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã gửi duyệt',
  PENDING: 'Chờ duyệt',
  UNDER_REVIEW: 'Đang duyệt',
  NEEDS_INFO: 'Cần bổ sung thông tin',
  APPROVED: 'Đã duyệt',
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã huỷ',
}

const ORDER_STATUS_LABEL_EN: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING: 'Waiting for review',
  UNDER_REVIEW: 'Under review',
  NEEDS_INFO: 'More information required',
  APPROVED: 'Approved',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export const MISSION_STATUS_TONE: Record<MissionStatus, StatusTone> = {
  PLANNING: 'gray',
  PENDING_PAYMENT: 'yellow',
  PENDING_CONFIRMATION: 'yellow',
  READY: 'blue',
  SCHEDULED: 'blue',
  IN_PROGRESS: 'blue',
  AWAITING_REVIEW: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  CANCELLED: 'gray',
  // Legacy aliases:
  CREATED: 'gray',
  RESOURCE_ASSIGNING: 'yellow',
  WAITING_OPERATOR_ACCEPTANCE: 'yellow',
  CONNECTED: 'blue',
  PREFLIGHT_CHECKING: 'blue',
  READY_TO_FLY: 'green',
  FAILED_PREFLIGHT: 'red',
  PENDING_APPROVAL: 'yellow',
  IN_FLIGHT: 'blue',
  RETURNING: 'blue',
  POSTFLIGHT_CHECKING: 'blue',
  PENDING_REVIEW: 'blue',
}

const MISSION_STATUS_LABEL_VI: Record<MissionStatus, string> = {
  READY: 'Sẵn sàng chờ nghiệm thu',
  PLANNING: 'Đang chuẩn bị trước bay',
  PENDING_PAYMENT: 'Chờ khách hàng thanh toán',
  PENDING_CONFIRMATION: 'Chờ phi hành đoàn xác nhận',
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang thực hiện',
  AWAITING_REVIEW: 'Đã gửi Manager, chờ duyệt',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã huỷ',
  CREATED: 'Đã tạo mission',
  RESOURCE_ASSIGNING: 'Đang phân công resource',
  WAITING_OPERATOR_ACCEPTANCE: 'Chờ staff chấp nhận',
  CONNECTED: 'Đã kết nối GCS',
  PREFLIGHT_CHECKING: 'Đang precheck',
  READY_TO_FLY: 'Thiết bị sẵn sàng bay',
  FAILED_PREFLIGHT: 'Precheck không đạt',
  PENDING_APPROVAL: 'Chờ phê duyệt',
  IN_FLIGHT: 'Đang bay',
  RETURNING: 'Đang quay về',
  POSTFLIGHT_CHECKING: 'Đang kiểm tra sau bay',
  PENDING_REVIEW: 'Đã gửi Manager, chờ duyệt',
}

const MISSION_STATUS_LABEL_EN: Record<MissionStatus, string> = {
  READY: 'Ready for inspector start',
  PLANNING: 'Preparing for preflight',
  PENDING_PAYMENT: 'Waiting for customer payment',
  PENDING_CONFIRMATION: 'Waiting for crew acceptance',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  AWAITING_REVIEW: 'Pending manager approval',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  CREATED: 'Mission created',
  RESOURCE_ASSIGNING: 'Assigning resources',
  WAITING_OPERATOR_ACCEPTANCE: 'Waiting for staff acceptance',
  CONNECTED: 'GCS connected',
  PREFLIGHT_CHECKING: 'Preflight in progress',
  READY_TO_FLY: 'Device ready to fly',
  FAILED_PREFLIGHT: 'Preflight failed',
  PENDING_APPROVAL: 'Waiting for approval',
  IN_FLIGHT: 'In flight',
  RETURNING: 'Returning',
  POSTFLIGHT_CHECKING: 'Postflight check in progress',
  PENDING_REVIEW: 'Pending manager approval',
}

export type StatusMeta = { label: string; tone: StatusTone }

export function getOrderStatusMeta(
  status: OrderStatus,
  lang: Language,
): StatusMeta {
  return {
    label:
      lang === 'en'
        ? ORDER_STATUS_LABEL_EN[status]
        : ORDER_STATUS_LABEL_VI[status],
    tone: ORDER_STATUS_TONE[status],
  }
}

export function getMissionStatusMeta(
  status: MissionStatus,
  lang: Language,
): StatusMeta {
  return {
    label:
      lang === 'en'
        ? MISSION_STATUS_LABEL_EN[status]
        : MISSION_STATUS_LABEL_VI[status],
    tone: MISSION_STATUS_TONE[status],
  }
}

export function fmtDate(iso: string, locale: 'vi-VN' | 'en-US'): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Date first, then the time: `17/10/2026 02:44` (vi) / `10/17/2026, 02:44 AM` (en). */
export function fmtDateTime(iso: string, locale: 'vi-VN' | 'en-US'): string {
  const date = new Date(iso)
  const time = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return locale === 'vi-VN'
    ? `${fmtDate(iso, locale)} ${time}`
    : `${fmtDate(iso, locale)}, ${time}`
}
