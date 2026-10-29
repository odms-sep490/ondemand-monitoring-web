import type { OperatorMission } from '../../../types/mission'
import type { MissionPermissions } from '../../../../mission/types/permissions'
import { Alert, Button, Collapse, Tabs } from 'antd'
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
import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailViewMessages } from '../missionDetailView.messages'
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
  const { t, lang } = useI18n(missionDetailViewMessages)
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

  const errorAlert = actionError ? (
    <Alert type="error" showIcon message={actionError} />
  ) : null

  if (isAwaitingResponse(mission)) {
    return (
      <div className="stf-stack">
        <MissionHeader mission={mission} access={access} />
        <p className="stf-muted" style={{ margin: 0 }}>
          {[
            mission.serviceLabel,
            [formatVnDate(mission.date, lang), mission.startTime]
              .filter(Boolean)
              .join(' · '),
            locationLabel(mission.location, lang),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <DecisionSummary mission={mission} />
        <CardComponent
          className="stf-action-bar"
          role="region"
          aria-label={t.respondRegion}
        >
          <div className="stf-action-bar-body">
            <div className="stf-action-bar-text">
              {t.wantToAccept}
              {!access?.canRespond && <small>{t.noRespondPermission}</small>}
            </div>
            <div className="stf-action-bar-buttons">
              <Button
                danger
                onClick={onOpenReject}
                disabled={submitting || !access?.canRespond}
              >
                {t.reject}
              </Button>
              <Button
                type="primary"
                onClick={onAccept}
                disabled={submitting || !access?.canRespond}
              >
                {submitting ? t.processing : t.acceptMission}
              </Button>
            </div>
          </div>
        </CardComponent>
        {errorAlert}
        <MissionMapCard mission={mission} />
        <div className="stf-grid-2">
          <div className="stf-stack">
            <MissionInfoCard mission={mission} />
            {mission.managerNote ? <ManagerNoteCard mission={mission} /> : null}
          </div>
          <div className="stf-stack">
            <DroneDeviceCard mission={mission} />
          </div>
        </div>
        <Collapse
          items={[
            {
              key: 'checklist',
              label: (
                <>
                  <strong>{t.executionChecklist}</strong>
                  <div className="stf-muted" style={{ fontSize: 12.5 }}>
                    {t.checklistLocked}
                  </div>
                </>
              ),
              children: monitoringSection,
              forceRender: true,
            },
          ]}
        />
      </div>
    )
  }

  const tabItems = [
    {
      key: 'overview',
      label: t.tabOverview,
      children:
        tab === 'overview' ? (
          <div className="stf-grid-2">
            <div className="stf-stack">
              <MissionMapCard mission={mission} />
              {monitoringSection}
            </div>
            <div className="stf-stack stf-sticky">
              <MissionInfoCard mission={mission} />
              <DroneDeviceCard mission={mission} />
              {mission.managerNote ? (
                <ManagerNoteCard mission={mission} />
              ) : null}
            </div>
          </div>
        ) : null,
    },
    {
      key: 'checks',
      label: t.tabChecks,
      children:
        tab === 'checks' ? (
          <div className="stf-grid-2">
            <div className="stf-stack">
              <PrecheckCard
                preflight={preflightStatus}
                weather={weatherStatus}
              />
              <WeatherCard weather={weatherStatus} />
            </div>
            <div className="stf-stack">
              <PostcheckCard postflight={postflightStatus} />
            </div>
          </div>
        ) : null,
    },
    ...(canViewMissionMedia
      ? [
          {
            key: 'media',
            label: t.tabMedia,
            children:
              tab === 'media' ? (
                <MissionUploadedMedia
                  missionId={mission.id}
                  reviewStatus={resultApprovalStatus}
                  onChanged={refreshWorkspace}
                  refreshKey={mediaRevision}
                />
              ) : null,
          },
        ]
      : []),
  ]

  return (
    <div className="stf-stack">
      <MissionHeader
        mission={mission}
        access={access}
        submitting={submitting}
        onStartWorkflow={onStartWorkflow}
      />
      {resultActions}
      {errorAlert}
      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as 'overview' | 'checks' | 'media')}
        items={tabItems}
      />
    </div>
  )
}
