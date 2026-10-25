import { missionStatusTone } from '../../../../shared/lib/statusTone'
import { missionListTableMessages } from './components/MissionListTable.messages'
import type { OperatorMission } from '../../types/mission'
import {
  missionHasSafeStop,
  missionMayTerminate,
} from '../../../mission/lib/missionOperationalState'
import { operatorHref } from '../../routes'
import { hasAcknowledgedHandover } from '../../lib/flightWorkflowStorage'

export const STATUS_TONE = {
  ...missionStatusTone,
  UNKNOWN: 'gray',
  PENDING: 'gray',
  ACCEPTED: 'green',
  IN_FLIGHT: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
  FAILED: 'red',
} as const

export const MANAGER_SUBMISSION_TONE = {
  NEEDS_SUBMIT: 'yellow',
  PENDING_MANAGER: 'blue',
  SENT_TO_CUSTOMER: 'green',
} as const

export type Messages = (typeof missionListTableMessages)['vi']

export function actionFor(mission: OperatorMission, t: Messages) {
  const backendStatus = mission.backendStatus
  const permissions = mission.permissions
  if (missionHasSafeStop(mission) || backendStatus === 'CANCELLED') {
    return missionMayTerminate(mission, permissions?.canTerminateFlight)
      ? {
          label: 'Dừng chuyến bay',
          cls: 'odm-btn-rd',
          href: operatorHref({ screen: 'flight', missionId: mission.id }),
        }
      : permissions?.canMaintainDevice &&
          backendStatus === 'POSTFLIGHT_CHECKING'
        ? {
            label: t.action.inspect,
            cls: '',
            href: operatorHref({ screen: 'postflight', missionId: mission.id }),
          }
        : {
            label: 'Xem trạng thái dừng',
            cls: '',
            href: operatorHref({
              screen: 'missionDetail',
              missionId: mission.id,
            }),
          }
  }
  if (backendStatus === 'PENDING_REVIEW' || backendStatus === 'COMPLETED') {
    return {
      label: t.action.viewResult,
      cls: '',
      href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
    }
  }
  if (permissions?.canStartMission && backendStatus === 'SCHEDULED') {
    return {
      label: t.action.startMission,
      cls: 'odm-btn-ok',
      href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
    }
  }
  if (permissions) {
    if (
      backendStatus === 'PENDING_REVIEW' &&
      (permissions.canCompleteMission ||
        permissions.canSubmitMissionResult ||
        permissions.canExecuteMonitoringChecklist)
    ) {
      return {
        label: t.action.viewResult,
        cls: '',
        href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
      }
    }
    if (
      permissions.canMaintainDevice &&
      (backendStatus === 'RETURNING' || backendStatus === 'POSTFLIGHT_CHECKING')
    ) {
      return {
        label: t.action.inspect,
        cls: 'odm-btn-ok',
        href: operatorHref({ screen: 'postflight', missionId: mission.id }),
      }
    }
    if (
      permissions.canUploadMedia &&
      (backendStatus === 'PENDING_REVIEW' || backendStatus === 'COMPLETED')
    ) {
      return {
        label: t.action.reviewMedia,
        cls: 'odm-btn-p',
        href: operatorHref({ screen: 'upload', missionId: mission.id }),
      }
    }
    if (
      permissions.canInspectDevice ||
      permissions.canUploadMedia ||
      permissions.canMaintainDevice
    ) {
      return {
        label: t.action.details,
        cls: '',
        href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
      }
    }
    if (
      permissions.canControlFlight &&
      (backendStatus === 'READY_TO_FLY' ||
        backendStatus === 'IN_FLIGHT' ||
        backendStatus === 'IN_PROGRESS' ||
        backendStatus === 'RETURNING')
    ) {
      return {
        label: t.action.openCockpit,
        cls: 'odm-btn-bl',
        href: operatorHref({ screen: 'flight', missionId: mission.id }),
      }
    }
    if (permissions.canOperatePayload) {
      if (backendStatus === 'READY_TO_FLY') {
        if (hasAcknowledgedHandover(mission.id)) {
          return {
            label: t.action.details,
            cls: '',
            href: operatorHref({
              screen: 'missionDetail',
              missionId: mission.id,
            }),
          }
        }
        return {
          label: t.action.handover,
          cls: 'odm-btn-ok',
          href: operatorHref({ screen: 'handover', missionId: mission.id }),
        }
      }
      if (
        backendStatus === 'CONNECTED' ||
        backendStatus === 'PREFLIGHT_CHECKING' ||
        backendStatus === 'FAILED_PREFLIGHT'
      ) {
        return {
          label: t.action.preflight,
          cls: 'odm-btn-ok',
          href: operatorHref({ screen: 'preflight', missionId: mission.id }),
        }
      }
      if (backendStatus === 'SCHEDULED') {
        return {
          label: t.action.start,
          cls: 'odm-btn-ok',
          href: operatorHref({ screen: 'connect', missionId: mission.id }),
        }
      }
    }
  }
  // A lifecycle status alone never grants operational permission.
  return {
    label: t.action.details,
    cls: '',
    href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
  }
}

export function weekdayDdMm(
  dateStr: string,
  today: string,
  t: Messages,
  locale: string,
): string {
  if (!dateStr) return t.unscheduled
  const d = new Date(`${dateStr}T00:00:00+07:00`)
  if (dateStr === today) return t.today(d.toLocaleDateString(locale))
  return `${t.weekdays[d.getDay()]}, ${d.toLocaleDateString(locale)}`
}
