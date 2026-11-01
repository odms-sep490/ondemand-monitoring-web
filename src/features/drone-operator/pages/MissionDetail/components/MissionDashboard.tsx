import type { OperatorMission } from '../../../types/mission'
import type { MissionPermissions } from '../../../../mission/types/permissions'
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { MissionResultApprovalStatus } from '../../../../mission/types/mission'
import type {
  RuntimePreflightStatus,
  WeatherPreflightStatus,
  PostflightCheckStatus,
} from '../types'
import { Icon } from '../../../../../shared/components/Icon'
import {
  readStoredPreflightState,
  readStoredWeatherState,
  fetchPersistedPreflight,
  fetchLatestWeatherCheck,
  fetchLatestPostflightCheck,
} from '../checkData'
import { isAwaitingResponse } from '../missionResponse'
import { MissionHeader } from './MissionHeader'
import { DecisionSummary } from './DecisionSummary'
import { MissionMapCard } from './MissionMapCard'
import { MissionInfoCard } from './MissionInfoCard'
import { ManagerNoteCard } from './ManagerNoteCard'
import { DroneDeviceCard } from './DroneDeviceCard'
import { PrecheckCard } from './PrecheckCard'
import { WeatherCard } from './WeatherCard'
import { PostcheckCard } from './PostcheckCard'
import { MissionUploadedMedia } from '../../../../media/components/MissionUploadedMedia'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'

type MissionTab = 'overview' | 'checklist' | 'checks' | 'media'

// ─── Dashboard shell ──────────────────────────────────────────────────────────

export function MissionDashboard({
  mission,
  submitting,
  actionError,
  access,
  responseAccessLoading = false,
  responseAccessError = false,
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
  responseAccessLoading?: boolean
  responseAccessError?: boolean
  resultActions: ReactNode
  monitoringSection: ReactNode
  resultApprovalStatus: MissionResultApprovalStatus | null
  refreshWorkspace: () => void
  mediaRevision: number
  onAccept: () => void
  onStartWorkflow: () => void
  onOpenReject: () => void
}) {
  const { t } = useI18n(missionDetailPageMessages)
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
  const [tab, setTab] = useState<MissionTab>('overview')
  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const canViewMissionMedia =
    access?.canInspectDevice === true ||
    access?.canUploadMedia === true ||
    mission.status === 'COMPLETED' ||
    mission.backendStatus === 'PENDING_REVIEW'
  const tabs: Array<{ id: MissionTab; label: string }> = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'checks', label: 'Kiểm tra thiết bị' },
    ...(canViewMissionMedia
      ? [{ id: 'media' as const, label: 'Ảnh & video' }]
      : []),
  ]

  useEffect(() => {
    if (!canViewMissionMedia && tab === 'media') setTab('overview')
  }, [canViewMissionMedia, tab])

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft')
      nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex == null) return

    event.preventDefault()
    const nextTab = tabs[nextIndex]
    setTab(nextTab.id)
    tabButtonRefs.current[nextIndex]?.focus()
  }

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
      <div className="mds-dashboard mds-pending">
        <MissionHeader mission={mission} access={access} />
        <DecisionSummary mission={mission} />
        <div
          className="mds-action-bar"
          role="group"
          aria-labelledby="mission-response-heading"
        >
          <div className="mds-action-bar-text">
            <h2 id="mission-response-heading" className="mds-card-heading">
              Bạn có muốn nhận nhiệm vụ này?
            </h2>
            {access?.canRespond !== true && (
              <small>
                {responseAccessLoading
                  ? t.responseAccessLoading
                  : responseAccessError
                    ? t.responseAccessError
                    : t.responseAccessDenied}
              </small>
            )}
          </div>
          <div className="mds-action-bar-buttons">
            <button
              type="button"
              className="odm-btn odm-btn-rd"
              onClick={onOpenReject}
              disabled={submitting || access?.canRespond !== true}
            >
              Từ chối
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={onAccept}
              disabled={submitting || access?.canRespond !== true}
            >
              {submitting ? 'Đang xử lý...' : 'Chấp nhận nhiệm vụ'}
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
        <div className="mds-pending-grid">
          <div className="mds-col mds-pending-primary">
            <MissionMapCard mission={mission} />
            <details className="odm-card mds-pending-checklist">
              <summary>
                <span>Checklist thực hiện</span>
                <small>
                  <Icon name="lock" width={14} height={14} aria-hidden="true" />
                  Checklist chỉ đọc trước khi nhận nhiệm vụ. Bấm để xem trước.
                </small>
              </summary>
              <div className="mds-pending-checklist-body">
                {monitoringSection}
              </div>
            </details>
          </div>
          <div className="mds-col mds-pending-secondary">
            <MissionInfoCard mission={mission} compact />
            <DroneDeviceCard mission={mission} compact />
            {mission.managerNote ? <ManagerNoteCard mission={mission} /> : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mds-dashboard">
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

      <div className="mds-tabs" role="tablist" aria-label="Nội dung nhiệm vụ">
        {tabs.map((t, index) => (
          <button
            key={t.id}
            ref={(node) => {
              tabButtonRefs.current[index] = node
            }}
            type="button"
            role="tab"
            id={`mds-tab-${t.id}`}
            aria-controls="mds-tab-panel"
            aria-selected={tab === t.id}
            tabIndex={tab === t.id ? 0 : -1}
            className={`mds-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="mds-tab-panel"
        id="mds-tab-panel"
        role="tabpanel"
        aria-labelledby={`mds-tab-${tab}`}
        tabIndex={0}
      >
        {tab === 'overview' ? (
          <div className="mds-tab-grid">
            <div className="mds-col">
              <MissionMapCard mission={mission} />
            </div>
            <div className="mds-col mds-sticky-col">
              <MissionInfoCard mission={mission} overview />
              <DroneDeviceCard mission={mission} overview />
              {mission.managerNote ? (
                <ManagerNoteCard mission={mission} />
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === 'checklist' ? (
          <div className="mds-checklist-panel">{monitoringSection}</div>
        ) : null}

        {tab === 'checks' ? (
          <div className="mds-tab-grid">
            <div className="mds-col">
              <PrecheckCard
                preflight={preflightStatus}
                weather={weatherStatus}
              />
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
    </div>
  )
}
