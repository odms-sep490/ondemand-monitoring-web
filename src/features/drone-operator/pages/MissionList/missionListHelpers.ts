import type { OperatorMission } from '../../types/mission'
import type { Messages } from './missionListTypes'
import {
  missionHasSafeStop,
  missionMayTerminate,
} from '../../../mission/lib/missionOperationalState'
import { operatorHref } from '../../routes'
import { hasAcknowledgedHandover } from '../../lib/flightWorkflowStorage'

export const ACTIVE_RAIL_STATUSES = new Set([
  'CONNECTED',
  'PREFLIGHT_CHECKING',
  'FAILED_PREFLIGHT',
  'READY_TO_FLY',
  'IN_FLIGHT',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'PENDING_REVIEW',
])

export function latestMissionStatus(mission: OperatorMission) {
  return mission.backendStatus ?? mission.status
}

export function isRailMission(
  mission: OperatorMission,
  start: Date,
  now: Date,
) {
  const status = latestMissionStatus(mission)
  if (ACTIVE_RAIL_STATUSES.has(status)) return true
  if (status === 'COMPLETED' || mission.status === 'COMPLETED') return false
  if (mission.status !== 'ACCEPTED' && status !== 'SCHEDULED') return false
  return start.getTime() > now.getTime()
}

export function railMissionPriority(status: string) {
  if (ACTIVE_RAIL_STATUSES.has(status)) return 0
  return 1
}

export function railStatusTone(status: string) {
  if (status === 'PENDING_REVIEW' || status === 'READY_TO_FLY') return 'blue'
  if (status === 'FAILED_PREFLIGHT') return 'red'
  if (
    status === 'IN_FLIGHT' ||
    status === 'IN_PROGRESS' ||
    status === 'RETURNING' ||
    status === 'POSTFLIGHT_CHECKING' ||
    status === 'PREFLIGHT_CHECKING'
  )
    return 'yellow'
  return 'green'
}

export function railActionFor(mission: OperatorMission, t: Messages) {
  const status = latestMissionStatus(mission)
  const permissions = mission.permissions
  if (missionHasSafeStop(mission)) {
    return {
      label: missionMayTerminate(mission, permissions?.canTerminateFlight)
        ? 'Dừng chuyến bay'
        : 'Xem trạng thái dừng',
      href: operatorHref({
        screen: missionMayTerminate(mission, permissions?.canTerminateFlight)
          ? 'flight'
          : 'missionDetail',
        missionId: mission.id,
      }),
    }
  }
  if (status === 'PENDING_REVIEW' || status === 'COMPLETED') {
    return {
      label: t.viewResult,
      href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
    }
  }
  if (
    permissions?.canMaintainDevice &&
    (status === 'RETURNING' || status === 'POSTFLIGHT_CHECKING')
  ) {
    return {
      label: t.inspect,
      href: operatorHref({ screen: 'postflight', missionId: mission.id }),
    }
  }
  if (
    status === 'PENDING_REVIEW' &&
    (permissions?.canUploadMedia ||
      permissions?.canCompleteMission ||
      permissions?.canExecuteMonitoringChecklist)
  ) {
    return {
      label: t.reviewMedia,
      href: operatorHref({ screen: 'checklist', missionId: mission.id }),
    }
  }
  if (permissions?.canStartMission && status === 'SCHEDULED') {
    return {
      label: t.startMission,
      href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
    }
  }
  if (
    permissions?.canControlFlight &&
    (status === 'IN_FLIGHT' ||
      status === 'IN_PROGRESS' ||
      status === 'RETURNING')
  ) {
    return {
      label: t.openCockpit,
      href: operatorHref({ screen: 'flight', missionId: mission.id }),
    }
  }
  if (permissions?.canOperatePayload && status === 'READY_TO_FLY') {
    if (hasAcknowledgedHandover(mission.id)) {
      return {
        label: t.details,
        href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
      }
    }
    return {
      label: t.handover,
      href: operatorHref({ screen: 'handover', missionId: mission.id }),
    }
  }
  if (
    permissions?.canOperatePayload &&
    (status === 'CONNECTED' ||
      status === 'PREFLIGHT_CHECKING' ||
      status === 'FAILED_PREFLIGHT')
  ) {
    return {
      label: t.precheck,
      href: operatorHref({ screen: 'preflight', missionId: mission.id }),
    }
  }
  if (permissions?.canOperatePayload && status === 'SCHEDULED') {
    return {
      label: t.connect,
      href: operatorHref({ screen: 'connect', missionId: mission.id }),
    }
  }
  return {
    label: t.details,
    href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
  }
}

export function headerDateLabel(now: Date, t: Messages): string {
  const weekday = t.weekdays[now.getDay()]
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${weekday}, ${dd}/${mm}/${now.getFullYear()} · ${hh}:${min}`
}

export function formatVn(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}
