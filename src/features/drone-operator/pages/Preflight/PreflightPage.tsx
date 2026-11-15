import { deviceRoleLabel } from '../../lib/deviceLabel'
import { useCallback, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { useActiveMission } from '../../api/useActiveMission'
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
  const { t, lang } = useI18n(preflightPageMessages)
  const [startError, setStartError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const assignments = (mission.data?.deviceAssignments ?? []).filter(a => Boolean(a.deviceId))
  const currentDeviceAssignment = assignments.find(a => a.deviceId === selectedDeviceId)
    ?? assignments.find(a => a.deviceId === mission.data?.deviceId)
    ?? assignments[0]
  const activeDeviceId = currentDeviceAssignment?.deviceId ?? mission.data?.deviceId
  const [checkedDevices, setCheckedDevices] = useState<Record<string, boolean>>({})
  const keyFor = (id: string | null | undefined) => `${mission.missionId}:${id}`
  const isPassed = (a: (typeof assignments)[number]) =>
    checkedDevices[keyFor(a.deviceId)] ?? (a.status === 'READY_TO_FLY' && a.checkupStatus === 'PASSED')
  const passedCount = assignments.filter(isPassed).length
  const allDevicesPassed = assignments.length > 0 && passedCount === assignments.length
  const activeKey = keyFor(activeDeviceId)
  const onStatusChange = useCallback((passed: boolean) => {
    setCheckedDevices(current => current[activeKey] === passed ? current : { ...current, [activeKey]: passed })
  }, [activeKey])
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
        throw new Error('Bạn cần được phân công vận hành để kiểm tra trước bay.')
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
      const deviceStillPending = latestMission.deviceAssignments?.find(
        (assignment) =>
          assignment.status !== 'READY_TO_FLY' || assignment.checkupStatus !== 'PASSED',
      )
      if (!latestMission.deviceAssignments?.length) throw new Error(t.backendPreflightUnconfirmed)
      mission.reload()
      if (deviceStillPending) {
        setSelectedDeviceId(deviceStillPending.deviceId ?? null)
        return
      }
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
    <div className="preflight-workspace">
      {(mission.error || startError) && (
        <p role="alert" style={{ color: 'var(--red-fg)' }}>
          {startError ??
            (mission.error instanceof Error
              ? friendlyPreflightError(mission.error, t.loadMissionFailed)
              : t.loadMissionFailed)}
        </p>
      )}
      {starting && <p>{t.confirmingTelemetry}</p>}
      <section className="preflight-device-picker" aria-label="Thiết bị kiểm tra trước bay">
        <div className="preflight-device-picker__heading">
          <div>
            <h1>Kiểm tra trước bay</h1>
            <p>Chọn và kiểm tra từng thiết bị. Tất cả thiết bị phải đạt trước khi bàn giao.</p>
          </div>
          <div className={`preflight-fleet-progress${allDevicesPassed ? ' is-complete' : ''}`} role="status">
            <strong>{passedCount}<span> / {assignments.length}</span></strong>
            <span>thiết bị đạt</span>
          </div>
        </div>
        <div className="preflight-fleet-track" role="progressbar" aria-label="Tiến độ kiểm tra thiết bị"
          aria-valuemin={0} aria-valuemax={assignments.length || 1} aria-valuenow={passedCount}>
          <span style={{ width: `${assignments.length ? passedCount / assignments.length * 100 : 0}%` }} />
        </div>
        <nav className="preflight-device-list" aria-label="Chọn thiết bị kiểm tra trước bay">
          {assignments.map((assignment, index) => {
            const selected = assignment.deviceId === activeDeviceId
            const passed = isPassed(assignment)
            return <button type="button" key={assignment.deviceId}
              className={`preflight-device-option${selected ? ' is-selected' : ''}${passed ? ' is-passed' : ''}`}
              aria-pressed={selected} onClick={() => setSelectedDeviceId(assignment.deviceId ?? null)}>
              <span className="preflight-device-option__number">{index + 1}</span>
              <span className="preflight-device-option__copy">
                <strong>{assignment.deviceCode ?? assignment.deviceSerialNumber ?? assignment.deviceId}</strong>
                <span>{deviceRoleLabel(assignment.deviceRole)}{selected ? ' · Đang chọn' : ''}</span>
              </span>
              <span className="preflight-device-option__status">{passed ? 'Đã đạt' : 'Cần kiểm tra'}</span>
            </button>
          })}
        </nav>
        {!assignments.length && <p className="preflight-device-picker__empty">Chưa có thiết bị được gán cho nhiệm vụ.</p>}
      </section>
      <PreflightChecklistPanel
        key={`${activeDeviceId}:${mission.missionId ?? 'no-mission'}:${preflightAssignmentKey}`}
        missionId={mission.missionId ?? NO_MISSION_SENTINEL}
        missionLabel={
          mission.data?.missionCode ?? mission.missionId ?? t.noMissionSelected
        }
        deviceId={activeDeviceId ?? NO_DRONE_SENTINEL}
        deviceAssignmentId={currentDeviceAssignment?.id}
        deviceAssignedAt={currentDeviceAssignment?.assignedAt}
        deviceLabel={currentDeviceAssignment?.deviceCode ?? currentDeviceAssignment?.deviceSerialNumber ?? activeDeviceId ?? undefined}
        missionStatus={mission.data?.status}
        replacementRequestPending={Boolean(
          currentDeviceAssignment?.replacementRequestedAt,
        )}
        manualOnly
        onStatusChange={onStatusChange}
        readyActionLabel={allDevicesPassed ? t.continueToHandover : (lang === 'vi' ? 'Kiểm tra thiết bị tiếp theo' : 'Check next drone')}
        onReady={() => {
          void handleContinueToHandover()
        }}
      />
    </div>
  )
}
