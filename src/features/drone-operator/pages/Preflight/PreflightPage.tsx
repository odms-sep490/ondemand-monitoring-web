import { useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { useActiveMission } from '../../api/useActiveMission'
import { formatDeviceLabel } from '../../lib/deviceLabel'
import { operatorHref } from '../../routes'
import { preflightPageMessages } from './PreflightPage.messages'
import { NO_MISSION_SENTINEL, NO_DRONE_SENTINEL } from './preflightConstants'
import {
  humanizePreflightDisplayText,
  isMissionInFlight,
} from './preflightHelpers'
import { PreflightChecklistPanel } from './components/PreflightChecklistPanel'

type PreflightErrorCopy = Pick<
  (typeof preflightPageMessages)['vi'],
  'airspacePermissionDenied' | 'preflightCheckFailed'
>

export function friendlyPreflightErrorMessage(
  message: string,
  t: PreflightErrorCopy,
) {
  if (/airspace_permission/i.test(message)) return t.airspacePermissionDenied
  if (/digital pre-device check failed|fault classified:/i.test(message))
    return t.preflightCheckFailed
  return humanizePreflightDisplayText(message)
}

export function PreflightPage({ missionId }: { missionId?: string }) {
  const mission = useActiveMission(missionId)
  const { t } = useI18n(preflightPageMessages)
  const [startError, setStartError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const currentDeviceAssignment = mission.data?.deviceAssignments
    ?.filter(
      (assignment) =>
        assignment.deviceRole === 'MAIN' &&
        assignment.deviceId === mission.data?.deviceId,
    )
    .sort(
      (left, right) =>
        Date.parse(right.assignedAt ?? '') - Date.parse(left.assignedAt ?? ''),
    )[0]
  const preflightAssignmentKey =
    [
      currentDeviceAssignment?.id,
      currentDeviceAssignment?.assignedAt,
      mission.data?.deviceId,
    ]
      .filter(Boolean)
      .join(':') || 'unassigned'

  async function handleContinueToHandover() {
    const data = mission.data
    const deviceId = data?.deviceId
    if (!mission.missionId || !deviceId) {
      setStartError(t.noDroneAssignedError)
      return
    }
    setStarting(true)
    setStartError(null)
    try {
      const permissions = await missionApi.getPermissions(mission.missionId)
      if (!permissions.canOperatePayload)
        throw new Error('Operator assignment is required for preflight.')
      if (isMissionInFlight(data?.status)) {
        if (permissions.canControlFlight) {
          window.sessionStorage.setItem(
            'odm.operator.autoStartSimulation',
            'true',
          )
        }
        window.location.hash = operatorHref({
          screen: permissions.canControlFlight ? 'flight' : 'missionDetail',
          missionId: mission.missionId,
        })
        return
      }
      const latestMission = await missionApi.getMissionById(mission.missionId)
      const deviceAlreadyPassed = latestMission.deviceAssignments?.some(
        (assignment) =>
          assignment.deviceRole === 'MAIN' &&
          assignment.deviceId === deviceId &&
          assignment.status === 'READY_TO_FLY',
      )
      if (!deviceAlreadyPassed)
        throw new Error(t.backendPreflightUnconfirmed)
      window.location.hash = operatorHref({
        screen: 'handover',
        missionId: mission.missionId,
      })
    } catch (cause) {
      setStartError(friendlyPreflightError(cause, t.confirmPrecheckFailed))
    } finally {
      setStarting(false)
    }
  }

  function friendlyPreflightError(cause: unknown, fallback: string) {
    const message = cause instanceof Error ? cause.message : ''
    return message ? friendlyPreflightErrorMessage(message, t) : fallback
  }

  return (
    <>
      {(mission.error || startError) && (
        <p role="alert" style={{ color: 'var(--red-fg)' }}>
          {startError ??
            (mission.error instanceof Error
              ? friendlyPreflightError(mission.error, t.loadMissionFailed)
              : t.loadMissionFailed)}
        </p>
      )}
      {starting && <p>{t.confirmingTelemetry}</p>}
      <PreflightChecklistPanel
        key={`${mission.missionId ?? 'no-mission'}:${preflightAssignmentKey}`}
        missionId={mission.missionId ?? NO_MISSION_SENTINEL}
        missionLabel={
          mission.data?.missionCode ?? mission.missionId ?? t.noMissionSelected
        }
        deviceId={mission.data?.deviceId ?? NO_DRONE_SENTINEL}
        deviceAssignmentId={currentDeviceAssignment?.id}
        deviceAssignedAt={currentDeviceAssignment?.assignedAt}
        deviceLabel={
          mission.data
            ? (formatDeviceLabel(mission.data) ?? undefined)
            : undefined
        }
        missionStatus={mission.data?.status}
        replacementRequestPending={Boolean(
          currentDeviceAssignment?.replacementRequestedAt,
        )}
        manualOnly
        onReady={() => {
          void handleContinueToHandover()
        }}
      />
    </>
  )
}
