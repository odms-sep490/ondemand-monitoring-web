import type {
  MissionStaffAssignmentResponse,
  PreflightCheckItem,
} from '../../types/missions'

export function formatDateTime(
  value: string | null | undefined,
  locale: 'vi-VN' | 'en-US',
) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const day = date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return locale === 'vi-VN' ? `${day} ${time}` : `${day}, ${time}`
}

export function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)}${suffix}`
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return '—'
  if (seconds < 60) return `${Math.round(seconds)} giây`
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return rest > 0 ? `${minutes} phút ${rest} giây` : `${minutes} phút`
}

export function checkTone(status: string | null | undefined) {
  if (status === 'PASSED' || status === 'APPROVED' || status === 'COMPLETED')
    return 'green'
  if (status === 'FAILED' || status === 'REJECTED') return 'red'
  if (status === 'CHECKING' || status === 'IN_PROGRESS') return 'blue'
  return 'amber'
}

export function checkLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    PASSED: 'Đạt',
    FAILED: 'Không đạt',
    PENDING: 'Chờ kiểm tra',
    CHECKING: 'Đang kiểm tra',
    CANCELLED: 'Đã hủy',
    COMPLETED: 'Hoàn thành',
    IN_PROGRESS: 'Đang xử lý',
    DRAFT: 'Nháp',
    PENDING_MANAGER_APPROVAL: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
  }
  return status ? (labels[status] ?? status) : '—'
}

export const STAFF_ROLE_LABELS: Record<
  MissionStaffAssignmentResponse['assignedRole'],
  string
> = {
  PILOT: 'Phi công',
  OPERATOR: 'Vận hành',
  MAINTAINER: 'Bảo trì',
  INSPECTOR: 'Nghiệm thu',
}

export const STAFF_RESPONSE_LABELS: Record<
  MissionStaffAssignmentResponse['responseStatus'],
  string
> = {
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
}

export function assignmentTone(
  status: MissionStaffAssignmentResponse['responseStatus'],
) {
  if (status === 'ACCEPTED') return 'green'
  if (status === 'REJECTED') return 'red'
  return 'amber'
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function unwrapSettled<T>(value: PromiseSettledResult<T>): T | null {
  return value.status === 'fulfilled' ? value.value : null
}

export function batteryFromPrecheck(
  items?: PreflightCheckItem[] | null,
): number | null {
  const item = items?.find((it) =>
    /battery/i.test(`${it.checkType} ${it.checkName}`),
  )
  const match = item?.message?.match(/(\d+(?:[.,]\d+)?)\s*%/)
  return match ? Number(match[1].replace(',', '.')) : null
}
