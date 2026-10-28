import type {
  MissionResourcePrepareStatus,
  MissionStaffAssignmentResponse,
  PreflightCheckItem,
} from '../../types/missions'
import type { StatusTone } from '../../../../shared/types/domain'
import { getLanguage } from '../../../../shared/i18n'
import { missionDetailHelpersMessages } from './missionDetailHelpers.messages'

const msgs = () => missionDetailHelpersMessages[getLanguage()]

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
  return `${new Intl.NumberFormat(getLanguage() === 'en' ? 'en-US' : 'vi-VN', { maximumFractionDigits: 1 }).format(value)}${suffix}`
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return '—'
  if (seconds < 60) return msgs().seconds(Math.round(seconds))
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return rest > 0
    ? msgs().minutesSeconds(minutes, rest)
    : msgs().minutes(minutes)
}

export function checkTone(status: string | null | undefined) {
  if (status === 'PASSED' || status === 'APPROVED' || status === 'COMPLETED')
    return 'green'
  if (status === 'FAILED' || status === 'REJECTED') return 'red'
  if (status === 'CHECKING' || status === 'IN_PROGRESS') return 'blue'
  return 'amber'
}

export function checkLabel(status: string | null | undefined) {
  const labels = msgs().checkLabels
  return status ? (labels[status] ?? status) : '—'
}

export const STAFF_ROLE_LABELS: Record<
  MissionStaffAssignmentResponse['assignedRole'],
  string
> = {
  get PILOT() {
    return msgs().staffRoles.PILOT
  },
  get OPERATOR() {
    return msgs().staffRoles.OPERATOR
  },
  get MAINTAINER() {
    return msgs().staffRoles.MAINTAINER
  },
  get INSPECTOR() {
    return msgs().staffRoles.INSPECTOR
  },
}

export const STAFF_RESPONSE_LABELS: Record<
  MissionStaffAssignmentResponse['responseStatus'],
  string
> = {
  get PLANNING() {
    return msgs().staffResponses.PLANNING
  },
  get PENDING() {
    return msgs().staffResponses.PENDING
  },
  get ACCEPTED() {
    return msgs().staffResponses.ACCEPTED
  },
  get REJECTED() {
    return msgs().staffResponses.REJECTED
  },
}

export function assignmentTone(
  status: MissionStaffAssignmentResponse['responseStatus'],
) {
  if (status === 'ACCEPTED') return 'green'
  if (status === 'REJECTED') return 'red'
  return 'amber'
}

export function missionResourcePrepareLabel(
  status: MissionResourcePrepareStatus | null | undefined,
): string {
  const labels: Record<MissionResourcePrepareStatus, string> = {
    PLANNING: 'Đang lập kế hoạch',
    PENDING: 'Đang chờ phản hồi và kiểm tra',
    READY: 'Đã sẵn sàng',
    CANCELLED: 'Đã hủy',
  }
  return status ? labels[status] : 'Chưa xác định'
}

export function missionResourcePrepareTone(
  status: MissionResourcePrepareStatus | null | undefined,
): StatusTone {
  if (status === 'READY') return 'green'
  if (status === 'PENDING') return 'yellow'
  if (status === 'CANCELLED') return 'red'
  return 'gray'
}

export function staffAssignmentStatusTone(
  status: MissionStaffAssignmentResponse['responseStatus'],
): StatusTone {
  if (status === 'ACCEPTED') return 'green'
  if (status === 'REJECTED') return 'red'
  if (status === 'PENDING') return 'yellow'
  return 'gray'
}

export function deviceAssignmentStatusTone(
  status: string | null | undefined,
): StatusTone {
  if (status === 'PASSED') return 'green'
  if (status === 'FAILED') return 'red'
  if (status === 'CHECKING') return 'blue'
  if (status === 'PENDING') return 'yellow'
  return 'gray'
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
