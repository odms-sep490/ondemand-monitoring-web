import type { Language } from '../../../../shared/i18n'
import {
  STATUS_LABEL,
  STATUS_LABEL_EN,
  PREFLIGHT_NAME_LABELS,
  PREFLIGHT_NAME_FALLBACKS,
} from './missionConstants'
import type {
  RuntimeOverallStatus,
  WeatherCheckStatus,
  RuntimeStatus,
  RuntimeCheck,
} from './types'

export function missionStatusLabel(
  status?: string | null,
  lang: Language = 'vi',
) {
  if (!status) return lang === 'en' ? 'Unknown' : 'Chưa xác định'
  if (lang === 'en') return STATUS_LABEL_EN[status] ?? 'Unsupported status'
  return STATUS_LABEL[status] ?? 'Trạng thái chưa hỗ trợ'
}

export function missionProgressBadge(
  status?: string | null,
  lang: Language = 'vi',
) {
  const en = lang === 'en'
  if (status === 'CONNECTED') {
    return {
      tone: 'blue' as const,
      label: en ? 'Workflow: GCS connected' : 'Quy trình: đã kết nối GCS',
    }
  }
  if (status === 'PREFLIGHT_CHECKING') {
    return {
      tone: 'blue' as const,
      label: en
        ? 'Workflow: preflight in progress'
        : 'Quy trình: đang kiểm tra trước bay',
    }
  }
  if (status === 'READY_TO_FLY') {
    return {
      tone: 'green' as const,
      label: en
        ? 'Workflow: ready for handover'
        : 'Quy trình: sẵn sàng bàn giao',
    }
  }
  return null
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatVnDate(isoDate: string, lang: Language = 'vi'): string {
  if (!isoDate) return lang === 'en' ? 'Not scheduled' : 'Chưa lên lịch'
  const d = new Date(`${isoDate}T00:00:00+07:00`)
  if (lang === 'en') {
    return `${d.toLocaleDateString('en-US', { weekday: 'long' })}, ${d.toLocaleDateString('en-GB')}`
  }
  const weekdays = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ]
  return `${weekdays[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`
}

export function formatHm(iso: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(iso)
  return m ? `${m[1]}:${m[2]}` : ''
}

export function dash(value?: string | number | null): string {
  if (value == null || value === '') return '—'
  return String(value)
}

export function formatCoord(value?: number | null): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(6)
    : '—'
}

export function missionDescriptionText(
  description: string | undefined,
  lang: Language = 'vi',
): string {
  const text = description?.trim() ?? ''
  const lower = text.toLowerCase()
  if (
    !text ||
    text.length < 2 ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'none'
  ) {
    return lang === 'en' ? 'No description yet' : 'Chưa có mô tả'
  }
  return text
}

export function locationLabel(value: string, lang: Language = 'vi'): string {
  if (lang === 'en') return value || 'No location yet'
  if (value === 'Construction Site') return 'Công trường'
  if (value === 'Dam') return 'Đập nước / hồ chứa'
  if (value === 'Warehouse') return 'Kho bãi'
  return value || 'Chưa có địa điểm'
}

export function statusTone(status?: RuntimeOverallStatus | WeatherCheckStatus) {
  if (status === 'READY' || status === 'PASS') return 'green'
  if (status === 'FAILED' || status === 'FAIL') return 'red'
  if (status === 'WARN') return 'yellow'
  return 'gray'
}

export function preflightLabel(
  status?: RuntimeOverallStatus,
  lang: Language = 'vi',
) {
  const en = lang === 'en'
  if (status === 'READY') return en ? 'Passed' : 'Đã đạt'
  if (status === 'FAILED') return en ? 'Failed' : 'Không đạt'
  if (status === 'CHECKING') return en ? 'Checking' : 'Đang kiểm'
  return en ? 'Not checked' : 'Chưa kiểm'
}

export function checkLabel(status: RuntimeStatus, lang: Language = 'vi') {
  const en = lang === 'en'
  if (status === 'PASS') return en ? 'Pass' : 'Đạt'
  if (status === 'WARN') return en ? 'Warning' : 'Cảnh báo'
  if (status === 'FAIL') return en ? 'Fail' : 'Không đạt'
  if (status === 'CHECKING') return en ? 'Checking' : 'Đang kiểm'
  return en ? 'Pending' : 'Chờ kiểm'
}

export function inspectionLabel(status?: string | null, lang: Language = 'vi') {
  const en = lang === 'en'
  if (status === 'PASS') return en ? 'Pass' : 'Đạt'
  if (status === 'WARN') return en ? 'Warning' : 'Cảnh báo'
  if (status === 'FAIL') return en ? 'Fail' : 'Không đạt'
  return en ? 'Unknown' : 'Chưa rõ'
}

export function preflightCheckName(item: RuntimeCheck, lang: Language = 'vi') {
  if (lang === 'en') return item.name
  return (
    PREFLIGHT_NAME_LABELS[item.key] ??
    PREFLIGHT_NAME_FALLBACKS[item.name] ??
    item.name
  )
}

export function preflightMessageLabel(message: string, lang: Language = 'vi') {
  const text = message.trim()
  if (!text) return ''
  if (lang === 'en') return text

  const lower = text.toLowerCase()
  if (lower.includes('required components'))
    return 'Đã tải đủ thành phần cần thiết'
  if (lower.includes('fresh scan received')) return 'Đã nhận dữ liệu quét mới'
  if (lower.includes('ready for takeoff')) return 'Sẵn sàng cất cánh'
  if (lower.includes('camera frames received'))
    return 'Đã nhận khung hình camera'
  if (lower.includes('sufficient for operation'))
    return text.replace('sufficient for operation', 'đủ để vận hành')
  if (lower.includes('ready to fly')) return 'Sẵn sàng bay'
  if (lower.includes('px4 health ready')) return 'Trạng thái PX4 sẵn sàng'
  if (lower.includes('drone model loaded')) return 'Đã tải mô hình drone'
  if (lower.includes('media capture pipeline ready'))
    return 'Luồng ghi media đã sẵn sàng'
  if (lower.includes('px4 discovered')) return 'Đã phát hiện PX4'
  if (lower.includes('flight controller'))
    return 'Bộ điều khiển bay đã sẵn sàng'
  if (lower.includes('heartbeat not available'))
    return 'Chưa nhận được heartbeat'
  if (lower.includes('too low for safe mission start'))
    return text.replace(
      'too low for safe mission start',
      'quá thấp để bắt đầu an toàn',
    )
  if (lower === 'pending') return 'Đang chờ'
  if (lower.includes('waiting for flight controller api'))
    return 'Đang chờ API bộ điều khiển bay'

  return text
}

export function formatNumber(value?: number | null, suffix = '', decimals = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${value.toFixed(decimals)}${suffix}`
}

export function postflightFaultLabel(
  faultType?: string | null,
  lang: Language = 'vi',
) {
  if (!faultType) return null
  const en = lang === 'en'
  if (faultType === 'PHYSICAL_DAMAGE')
    return en ? 'Airframe needs inspection' : 'Thân vỏ cần kiểm tra'
  if (faultType === 'BATTERY')
    return en ? 'Battery needs inspection' : 'Pin cần kiểm tra'
  if (faultType === 'HARDWARE')
    return en ? 'Hardware needs inspection' : 'Phần cứng cần kiểm tra'
  return faultType.replaceAll('_', ' ')
}

export function postflightNoteLabel(notes?: string | null) {
  if (!notes) return ''
  return notes.replace(/^Inspection:\s*[^.]*\.\s*/i, '').trim()
}

export function formatCheckedAt(value?: string, lang: Language = 'vi') {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(lang === 'en' ? 'en-GB' : 'vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}
