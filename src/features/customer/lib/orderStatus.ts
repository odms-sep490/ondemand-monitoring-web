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
  PENDING: 'Đang duyệt',
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
  PENDING: 'Pending review',
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
  CREATED: 'gray',
  WAITING_DEPOSIT: 'yellow',
  READY: 'blue',
  RESOURCE_ASSIGNING: 'yellow',
  WAITING_OPERATOR_ACCEPTANCE: 'yellow',
  SCHEDULED: 'blue',
  CONNECTED: 'blue',
  PREFLIGHT_CHECKING: 'blue',
  READY_TO_FLY: 'green',
  FAILED_PREFLIGHT: 'red',
  PENDING_APPROVAL: 'yellow',
  IN_FLIGHT: 'blue',
  IN_PROGRESS: 'blue',
  RETURNING: 'orange',
  POSTFLIGHT_CHECKING: 'orange',
  PENDING_REVIEW: 'yellow',
  COMPLETED: 'green',
  FAILED: 'red',
  CANCELLED: 'gray',
}

const MISSION_STATUS_LABEL_VI: Record<MissionStatus, string> = {
  READY: 'Mission đã xác nhận; đang chuẩn bị resource',
  PLANNING: 'Đang lập kế hoạch',
  CREATED: 'Mới tạo',
  WAITING_DEPOSIT: 'Chờ thanh toán tiền cọc',
  RESOURCE_ASSIGNING: 'Phân công nguồn lực',
  WAITING_OPERATOR_ACCEPTANCE: 'Chờ phi công xác nhận',
  SCHEDULED: 'Đã lên lịch',
  CONNECTED: 'Đã kết nối',
  PREFLIGHT_CHECKING: 'Kiểm tra trước bay',
  READY_TO_FLY: 'Sẵn sàng bay',
  FAILED_PREFLIGHT: 'Lỗi kiểm tra',
  PENDING_APPROVAL: 'Chờ phê duyệt',
  IN_FLIGHT: 'Đang bay',
  IN_PROGRESS: 'Đang thực hiện',
  RETURNING: 'Đang quay về',
  POSTFLIGHT_CHECKING: 'Kiểm tra sau bay',
  PENDING_REVIEW: 'Chờ nghiệm thu',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã huỷ',
}

const MISSION_STATUS_LABEL_EN: Record<MissionStatus, string> = {
  READY: 'Confirmed, preparing resources',
  PLANNING: 'Planning',
  CREATED: 'Created',
  WAITING_DEPOSIT: 'Waiting for deposit',
  RESOURCE_ASSIGNING: 'Assigning resources',
  WAITING_OPERATOR_ACCEPTANCE: 'Waiting for operator',
  SCHEDULED: 'Scheduled',
  CONNECTED: 'Connected',
  PREFLIGHT_CHECKING: 'Preflight check running',
  READY_TO_FLY: 'Ready to fly',
  FAILED_PREFLIGHT: 'Preflight check failed',
  PENDING_APPROVAL: 'Pending approval',
  IN_FLIGHT: 'In flight',
  IN_PROGRESS: 'In progress',
  RETURNING: 'Returning',
  POSTFLIGHT_CHECKING: 'Postflight check running',
  PENDING_REVIEW: 'Awaiting inspection',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
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
