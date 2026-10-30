import type { OperatorMission } from '../../../types/mission'
import type { MissionPermissions } from '../../../../mission/types/permissions'
import {
  missionHasSafeStop,
  missionStopLabel,
  missionMayTerminate,
} from '../../../../mission/lib/missionOperationalState'
import { missionProgressBadge, missionStatusLabel } from '../missionFormat'
import {
  GCS_CONNECTED_STATUSES,
  INSPECTION_MEDIA_STATUSES,
  STATUS_TONE,
} from '../missionConstants'
import { operatorHref } from '../../../routes'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { Icon } from '../../../../../shared/components/Icon'

// ─── Mission Header ───────────────────────────────────────────────────────────

export function MissionHeader({
  mission,
  access,
  submitting,
  onStartWorkflow,
}: {
  mission: OperatorMission
  access?: MissionPermissions
  submitting?: boolean
  onStartWorkflow?: () => void
}) {
  const hasAccepted = mission.myResponseStatus === 'ACCEPTED'
  const stopping = missionHasSafeStop(mission)
  const progressBadge = stopping
    ? null
    : missionProgressBadge(mission.backendStatus)
  const backendStatus = mission.backendStatus ?? mission.status
  const canConnectGcs =
    !stopping &&
    access?.canOperatePayload === true &&
    backendStatus === 'SCHEDULED' &&
    !GCS_CONNECTED_STATUSES.has(backendStatus)
  const canRunPreflight =
    !stopping &&
    access?.canOperatePayload === true &&
    ['CONNECTED', 'PREFLIGHT_CHECKING', 'FAILED_PREFLIGHT'].includes(
      backendStatus,
    )
  const canHandleInspectionMedia =
    INSPECTION_MEDIA_STATUSES.has(backendStatus) &&
    (access?.canInspectDevice === true ||
      access?.canCompleteMission === true ||
      access?.canUploadMedia === true)
  const showProgressBadge =
    progressBadge &&
    !(access?.canInspectDevice === true || access?.canUploadMedia === true)
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
        <StatusBadge tone={STATUS_TONE[mission.status]}>
          {missionStopLabel(mission) ??
            missionStatusLabel(mission.backendStatus ?? mission.status)}
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
            mission.backendStatus ?? '',
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
        {showProgressBadge ? (
          <StatusBadge tone={progressBadge.tone}>
            {progressBadge.label}
          </StatusBadge>
        ) : null}
        {/* Action permissions come from the backend assignment policy. */}
        {stopping ? (
          missionMayTerminate(mission, access?.canTerminateFlight) ? (
            <a
              className="odm-btn odm-btn-rd"
              href={operatorHref({ screen: 'flight', missionId: mission.id })}
            >
              Dừng chuyến bay
            </a>
          ) : null
        ) : hasAccepted &&
          (backendStatus === 'READY' ||
            backendStatus === 'WAITING_OPERATOR_ACCEPTANCE') ? (
          access?.canStartMission ? (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={submitting}
              onClick={onStartWorkflow}
            >
              {submitting ? 'Đang bắt đầu...' : 'Bắt đầu Mission'}
            </button>
          ) : (
            <StatusBadge tone="green">Đã chấp nhận</StatusBadge>
          )
        ) : mission.status === 'PENDING' ? null : mission.backendStatus ===
            'READY_TO_FLY' && access?.canControlFlight ? (
          <a
            className="odm-btn odm-btn-p"
            href={operatorHref({ screen: 'flight', missionId: mission.id })}
          >
            Mở buồng lái
          </a>
        ) : canConnectGcs ? (
          <a
            className="odm-btn odm-btn-p mds-cta"
            href={operatorHref({ screen: 'connect', missionId: mission.id })}
          >
            <Icon name="zap" width={16} height={16} aria-hidden="true" />
            Kết nối GCS
          </a>
        ) : mission.status === 'IN_FLIGHT' ? (
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
