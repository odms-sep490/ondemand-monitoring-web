import { hasMissionFlightEnded } from './missionFlightLifecycle'
import type { Language } from '../../../shared/i18n/languageStore'
import type { OperatorMission } from '../types/mission'

function diffParts(ms: number): {
  days: number
  hours: number
  minutes: number
} {
  const totalMinutes = Math.max(0, Math.round(ms / 60000))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  return { days, hours, minutes }
}

function countdownLabel(ms: number, lang: Language): string {
  const { days, hours, minutes } = diffParts(ms)
  if (lang === 'en') {
    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`
  if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`
  return `Còn ${minutes} phút`
}

/** Human label for the "Thời hạn" column, matching OPR-01W's wording per status. */
export function formatDeadline(
  mission: OperatorMission,
  now: Date,
  lang: Language = 'vi',
): string {
  if (hasMissionFlightEnded(mission)
    && !['COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED'].includes(mission.status)
    && !['COMPLETED', 'FAILED', 'CANCELLED'].includes(mission.backendStatus ?? ''))
    return lang === 'en' ? 'Flight ended' : 'Đã kết thúc bay'
  const start = new Date(`${mission.date}T${mission.startTime}:00+07:00`)
  if (!mission.date || !mission.startTime || Number.isNaN(start.getTime())) {
    if (lang === 'en') {
      return mission.status === 'COMPLETED' ? 'Completed' : 'Not scheduled'
    }
    return mission.status === 'COMPLETED' ? 'Hoàn thành' : 'Chưa đặt lịch'
  }

  switch (mission.status) {
    case 'PENDING':
      return countdownLabel(start.getTime() - now.getTime(), lang)
    case 'ACCEPTED':
      return countdownLabel(start.getTime() - now.getTime(), lang)
    case 'IN_FLIGHT': {
      const started = mission.flightStartedAt
        ? new Date(mission.flightStartedAt)
        : start
      const minutes = Math.max(
        0,
        Math.round((now.getTime() - started.getTime()) / 60000),
      )
      return lang === 'en'
        ? `In flight ${minutes} min`
        : `Đang bay ${minutes} phút`
    }
    case 'COMPLETED': {
      if (!mission.completedAt)
        return lang === 'en' ? 'Completed' : 'Hoàn thành'
      // Read HH:MM straight out of the ISO string (it always carries +07:00)
      // rather than through Date getters, which resolve in the browser's
      // local timezone and would shift the displayed time.
      const match = /T(\d{2}):(\d{2})/.exec(mission.completedAt)
      if (!match) return lang === 'en' ? 'Completed' : 'Hoàn thành'
      return lang === 'en'
        ? `Completed ${match[1]}:${match[2]}`
        : `Hoàn thành ${match[1]}:${match[2]}`
    }
    case 'REJECTED':
      return mission.rejectReason ?? (lang === 'en' ? 'Rejected' : 'Bị từ chối')
    case 'FAILED':
      if (lang === 'en') {
        return mission.backendStatus === 'CANCELLED'
          ? 'Cancelled'
          : 'Not completed'
      }
      return mission.backendStatus === 'CANCELLED'
        ? 'Đã huỷ'
        : 'Không hoàn thành'
    default:
      return ''
  }
}
