import type { OperatorMission } from '../../../types/mission'
import type { MissionPermissions } from '../../../../mission/types/permissions'
import { missionStatusLabel } from '../missionFormat'
import { INSPECTION_MEDIA_STATUSES, STATUS_TONE } from '../missionConstants'
import { operatorHref } from '../../../routes'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { hasAcknowledgedHandover } from '../../../lib/flightWorkflowStorage'
import type { WeatherPreflightStatus } from '../types'
import { isWeatherCheckFresh } from '../weatherReadiness'

// ─── Mission Header ───────────────────────────────────────────────────────────

export function MissionHeader({
  mission,
  access,
  submitting,
  weatherStatus = null,
  weatherLoading = false,
  onStartWorkflow,
}: {
  mission: OperatorMission
  access?: MissionPermissions
  submitting?: boolean
  weatherStatus?: WeatherPreflightStatus | null
  weatherLoading?: boolean
  onStartWorkflow?: () => void
}) {
  const { t } = useI18n(missionDetailPageMessages)
  const hasAccepted = mission.myResponseStatus === 'ACCEPTED'
  const backendStatus = mission.backendStatus ?? mission.status
  const missionPreparing =
    backendStatus === 'PLANNING' ||
    backendStatus === 'PENDING_CONFIRMATION' ||
    backendStatus === 'SCHEDULED' ||
    backendStatus === 'READY'
  const headerStatus =
    mission.myResponseStatus === 'ACCEPTED'
      ? (backendStatus as OperatorMission['status'])
      : mission.status
  const deviceState = mission.deviceAssignmentStatus ?? ''
  const canHandover =
    backendStatus === 'PENDING_CONFIRMATION' &&
    deviceState === 'READY_TO_FLY' &&
    access?.canOperatePayload === true &&
    !hasAcknowledgedHandover(mission.id)
  const canConnectGcs =
    access?.canOperatePayload === true &&
    missionPreparing &&
    (!deviceState ||
      deviceState === 'ASSIGNED' ||
      deviceState === 'CONNECTION_LOST')
  const canStartMission =
    hasAccepted &&
    backendStatus === 'READY' &&
    (deviceState === 'READY_TO_FLY' || mission.status === 'READY_TO_FLY') &&
    access?.canStartMission === true
  const weatherConditionsReady =
    isWeatherCheckFresh(weatherStatus) && weatherStatus?.safeToFly === true
  const weatherIsReady =
    weatherConditionsReady && weatherStatus?.inspectorAccepted === true
  const canRunPreflight =
    access?.canOperatePayload === true &&
    missionPreparing &&
    ['CONNECTED', 'PREFLIGHT_CHECKING', 'FAILED_PREFLIGHT', 'FAILED'].includes(
      deviceState || backendStatus,
    )
  const crewStillPending =
    mission.assignedStaffCount != null &&
    mission.acceptedStaffCount != null &&
    mission.acceptedStaffCount < mission.assignedStaffCount
  const canHandleInspectionMedia =
    (INSPECTION_MEDIA_STATUSES.has(backendStatus) ||
      (backendStatus === 'IN_PROGRESS' &&
        (access?.canCompleteMission === true ||
          access?.canSubmitMissionResult === true))) &&
    (access?.canInspectDevice === true ||
      access?.canCompleteMission === true ||
      access?.canUploadMedia === true)
  const responseStatusLabel =
    backendStatus === 'PENDING_CONFIRMATION' &&
    mission.myResponseStatus === 'ACCEPTED'
      ? deviceState === 'READY_TO_FLY' && crewStillPending
        ? t.statusPreflightReadyWaitingCrew(
            mission.acceptedStaffCount ?? 0,
            mission.assignedStaffCount ?? 0,
          )
        : deviceState === 'PREFLIGHT_CHECKING'
          ? t.statusPreflight
          : deviceState === 'CONNECTED'
            ? t.statusConnected
            : deviceState === 'FAILED'
              ? t.statusPreflightFailed
              : crewStillPending && access?.canOperatePayload !== true
                ? t.statusWaitingCrew(
                    mission.acceptedStaffCount ?? 0,
                    mission.assignedStaffCount ?? 0,
                  )
                : crewStillPending
                  ? t.statusOperatorPreflight(
                      mission.acceptedStaffCount ?? 0,
                      mission.assignedStaffCount ?? 0,
                    )
                  : deviceState === 'READY_TO_FLY'
                    ? t.statusHandover
                    : t.statusWaitingConnection
      : backendStatus === 'IN_PROGRESS' && deviceState === 'RETURNING'
        ? t.statusReturning
        : backendStatus === 'IN_PROGRESS' &&
            deviceState === 'POSTFLIGHT_CHECKING'
          ? t.statusPostflight
          : missionStatusLabel(headerStatus)
  return (
    <div className="mds-header">
      {/* Row 1: code + badge + actions */}
      <div className="mds-header-row">
        <a
          href={operatorHref({ screen: 'missions' })}
          className="odm-btn odm-btn-sm odm-btn-ic1"
          style={{ flexShrink: 0, fontSize: 16, minWidth: 44, minHeight: 44 }}
          title="Về danh sách"
          aria-label="Về danh sách nhiệm vụ"
        >
          <span aria-hidden="true">←</span>
        </a>
        <h1 id="mission-detail-title" className="mds-title">
          <span className="odm-mono">
            Mission {mission.missionCode ?? mission.id}
          </span>
        </h1>
        <StatusBadge tone={STATUS_TONE[headerStatus]} size="lg">
          {responseStatusLabel}
        </StatusBadge>

        {/* spacer */}
        <div style={{ flex: 1 }} />
        {canRunPreflight && (
          <a
            className="odm-btn"
            href={operatorHref({ screen: 'preflight', missionId: mission.id })}
          >
            Kiểm tra thiết bị
          </a>
        )}
        {access?.canMaintainDevice &&
          ['RETURNING', 'POSTFLIGHT_CHECKING'].includes(
            mission.deviceAssignmentStatus ?? '',
          ) && (
            <a
              className="odm-btn"
              href={operatorHref({
                screen: 'postflight',
                missionId: mission.id,
              })}
            >
              Kiểm tra sau bay
            </a>
          )}
        {canHandleInspectionMedia && (
          <a
            className="odm-btn"
            href={operatorHref({ screen: 'checklist', missionId: mission.id })}
          >
            Mở dữ liệu nghiệm thu
          </a>
        )}
        {/* Action permissions come from the backend assignment policy. */}
        {canStartMission ? (
          weatherIsReady ? (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={submitting || weatherLoading}
              onClick={onStartWorkflow}
            >
              {submitting ? 'Đang bắt đầu Mission...' : t.startMission}
            </button>
          ) : null
        ) : mission.status === 'PENDING' ? null : canHandover ? (
          <a
            className="odm-btn odm-btn-ok"
            href={operatorHref({ screen: 'handover', missionId: mission.id })}
          >
            Bàn giao quyền điều khiển
          </a>
        ) : canConnectGcs ? (
          <a
            className="odm-btn odm-btn-p mds-cta"
            href={operatorHref({ screen: 'connect', missionId: mission.id })}
          >
            <Icon name="zap" width={16} height={16} aria-hidden="true" />
            Kết nối GCS
          </a>
        ) : backendStatus === 'IN_PROGRESS' ||
          mission.status === 'IN_FLIGHT' ? (
          <>
            {access?.canUploadMedia && (
              <a
                className="odm-btn"
                href={operatorHref({
                  screen: 'checklist',
                  missionId: mission.id,
                })}
              >
                Review media
              </a>
            )}
            {access?.canControlFlight && (
              <a
                className="odm-btn odm-btn-p"
                href={operatorHref({ screen: 'flight', missionId: mission.id })}
              >
                Mở buồng lái
              </a>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
