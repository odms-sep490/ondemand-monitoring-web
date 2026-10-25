import type { OperatorMission } from '../../../types/mission'
import type { MissionPermissions } from '../../../../mission/types/permissions'
import { type ReactNode, useState, useEffect } from 'react'
import type { MissionResultApprovalStatus } from '../../../../mission/types/mission'
import type {
  RuntimePreflightStatus,
  WeatherPreflightStatus,
  PostflightCheckStatus,
} from '../types'
import {
  readStoredPreflightState,
  readStoredWeatherState,
  fetchPersistedPreflight,
  fetchLatestWeatherCheck,
  fetchLatestPostflightCheck,
} from '../checkData'
import { isAwaitingResponse } from '../missionResponse'
import { MissionHeader } from './MissionHeader'
import { formatVnDate, locationLabel } from '../missionFormat'
import { DecisionSummary } from './DecisionSummary'
import { MissionMapCard } from './MissionMapCard'
import { MissionInfoCard } from './MissionInfoCard'
import { ManagerNoteCard } from './ManagerNoteCard'
import { DroneDeviceCard } from './DroneDeviceCard'
import { PrecheckCard } from './PrecheckCard'
import { WeatherCard } from './WeatherCard'
import { PostcheckCard } from './PostcheckCard'
import { MissionUploadedMedia } from '../../../../media/components/MissionUploadedMedia'

// ─── Dashboard shell ──────────────────────────────────────────────────────────

export function MissionDashboard({
  mission,
  submitting,
  actionError,
  access,
  resultActions,
  monitoringSection,
  resultApprovalStatus,
  refreshWorkspace,
  mediaRevision,
  onAccept,
  onStartWorkflow,
  onOpenReject,
}: {
  mission: OperatorMission
  submitting: boolean
  actionError: string | null
  access?: MissionPermissions
  resultActions: ReactNode
  monitoringSection: ReactNode
  resultApprovalStatus: MissionResultApprovalStatus | null
  refreshWorkspace: () => void
  mediaRevision: number
  onAccept: () => void
  onStartWorkflow: () => void
  onOpenReject: () => void
}) {
  const deviceId = mission.deviceId
  const [preflightStatus, setPreflightStatus] =
    useState<RuntimePreflightStatus | null>(() =>
      readStoredPreflightState(mission.id, deviceId),
    )
  const [weatherStatus, setWeatherStatus] =
    useState<WeatherPreflightStatus | null>(() =>
      readStoredWeatherState(mission.id, deviceId),
    )
  const [postflightStatus, setPostflightStatus] =
    useState<PostflightCheckStatus | null>(null)
  const [tab, setTab] = useState<'overview' | 'checks' | 'media'>('overview')
  const canViewMissionMedia =
    access?.canInspectDevice === true ||
    access?.canUploadMedia === true ||
    mission.status === 'COMPLETED' ||
    mission.backendStatus === 'PENDING_REVIEW'
  const tabs: Array<{ id: 'overview' | 'checks' | 'media'; label: string }> = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'checks', label: 'Kết quả kiểm tra thiết bị' },
    ...(canViewMissionMedia
      ? [{ id: 'media' as const, label: 'Ảnh & video' }]
      : []),
  ]

  useEffect(() => {
    setPreflightStatus(readStoredPreflightState(mission.id, deviceId))
    setWeatherStatus(readStoredWeatherState(mission.id, deviceId))
    setPostflightStatus(null)
    const controller = new AbortController()
    fetchPersistedPreflight(mission.id, controller.signal)
      .then((status) => {
        if (status) setPreflightStatus(status)
      })
      .catch(() => {
        // Local precheck cache is still shown if backend history is unavailable.
      })
    fetchLatestWeatherCheck(mission.id, controller.signal)
      .then((status) => {
        if (status) setWeatherStatus(status)
      })
      .catch(() => {
        // Local weather cache is still shown if backend history is unavailable.
      })
    fetchLatestPostflightCheck(mission.id, controller.signal)
      .then((status) => {
        setPostflightStatus(status)
      })
      .catch(() => {
        setPostflightStatus(null)
      })
    return () => controller.abort()
  }, [deviceId, mission.id])

  if (isAwaitingResponse(mission)) {
    return (
      <div className="mds-pending">
        <MissionHeader mission={mission} access={access} />
        <p className="mds-meta-line">
          {[
            mission.serviceLabel,
            [formatVnDate(mission.date), mission.startTime]
              .filter(Boolean)
              .join(' · '),
            locationLabel(mission.location),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <DecisionSummary mission={mission} />
        <div
          className="mds-action-bar"
          role="region"
          aria-label="Phản hồi nhiệm vụ"
        >
          <div className="mds-action-bar-text">
            Bạn có muốn nhận nhiệm vụ này?
            {!access?.canRespond && (
              <small>Bạn chưa có quyền phản hồi nhiệm vụ này.</small>
            )}
          </div>
          <div className="mds-action-bar-buttons">
            <button
              type="button"
              className="odm-btn odm-btn-rd"
              onClick={onOpenReject}
              disabled={submitting || !access?.canRespond}
            >
              Từ chối
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={onAccept}
              disabled={submitting || !access?.canRespond}
            >
              {submitting ? 'Đang xử lý...' : '✓ Chấp nhận nhiệm vụ'}
            </button>
          </div>
        </div>
        {actionError ? (
          <div
            role="alert"
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--red-bg)',
              color: 'var(--red-fg)',
              border: '1px solid var(--red-dot)',
              fontSize: 13,
            }}
          >
            {actionError}
          </div>
        ) : null}
        <MissionMapCard mission={mission} />
        <div className="mds-tab-grid" style={{ marginTop: 16 }}>
          <div className="mds-col">
            <MissionInfoCard mission={mission} />
            {mission.managerNote ? <ManagerNoteCard mission={mission} /> : null}
          </div>
          <div className="mds-col">
            <DroneDeviceCard mission={mission} />
          </div>
        </div>
        <details className="odm-card mds-pending-checklist">
          <summary>
            Checklist thực hiện
            <small>
              🔒 Checklist sẽ được mở sau khi bạn chấp nhận nhiệm vụ. Bấm để xem
              trước.
            </small>
          </summary>
          <div className="mds-pending-checklist-body">{monitoringSection}</div>
        </details>
      </div>
    )
  }

  return (
    <div>
      {/* ── Header ── */}
      <MissionHeader
        mission={mission}
        access={access}
        submitting={submitting}
        onStartWorkflow={onStartWorkflow}
      />

      {resultActions}

      {actionError ? (
        <div
          role="alert"
          style={{
            marginBottom: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--red-bg)',
            color: 'var(--red-fg)',
            border: '1px solid var(--red-dot)',
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      ) : null}

      <div className="mds-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`mds-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="mds-tab-grid">
          <div className="mds-col">
            <MissionMapCard mission={mission} />
            {monitoringSection}
          </div>
          <div className="mds-col mds-sticky-col">
            <MissionInfoCard mission={mission} />
            <DroneDeviceCard mission={mission} />
            {mission.managerNote ? <ManagerNoteCard mission={mission} /> : null}
          </div>
        </div>
      ) : null}

      {tab === 'checks' ? (
        <div className="mds-tab-grid">
          <div className="mds-col">
            <PrecheckCard preflight={preflightStatus} weather={weatherStatus} />
            <WeatherCard weather={weatherStatus} />
          </div>
          <div className="mds-col">
            <PostcheckCard postflight={postflightStatus} />
          </div>
        </div>
      ) : null}

      {tab === 'media' && canViewMissionMedia ? (
        <MissionUploadedMedia
          missionId={mission.id}
          reviewStatus={resultApprovalStatus}
          onChanged={refreshWorkspace}
          refreshKey={mediaRevision}
        />
      ) : null}
    </div>
  )
}
