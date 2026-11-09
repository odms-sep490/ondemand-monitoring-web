import { useMemo, useState } from 'react'

import {
  EmptyState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../shared/i18n'
import { useActiveMission } from '../../api/useActiveMission'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { missionApi } from '../../../mission/api/missionApi'
import { operatorHref } from '../../routes'
import { type FlightControlStatus } from '../../api/flightControlApi'
import { formatDeviceLabel } from '../../lib/deviceLabel'
import { postflightSummary } from '../../lib/postflightSummary'
import type { PostflightItem, PreflightItemResult } from '../../types/mission'
import { postflightPageMessages } from './PostflightPage.messages'
import { MaintenanceTicketDialog } from './components/MaintenanceTicketDialog'
import { type ResultsState } from './postflightTypes'
import {
  postflightCategories,
  ALL_KEYS,
  readPostflightTelemetry,
} from './postflightHelpers'
import { usePostflightTelemetry } from './usePostflightTelemetry'
import { usePostflightAssessment } from './usePostflightAssessment'
import { fetchLatestPostflightCheck } from '../MissionDetail/checkData'
import { PostflightCompletedView } from './components/PostflightCompletedView'
import { PostflightHeader } from './components/PostflightHeader'
import { PostflightErrorBanner } from './components/PostflightErrorBanner'
import { TelemetrySummary } from './components/TelemetrySummary'
import { AssessmentProgress } from './components/AssessmentProgress'
import { InspectionCategory } from './components/InspectionCategory'
import { PostflightNotes } from './components/PostflightNotes'
import { MaintenanceBanner } from './components/MaintenanceBanner'
import { TicketCreatedBanner } from './components/TicketCreatedBanner'
import { PostflightSubmitButton } from './components/PostflightSubmitButton'
import './PostflightPage.css'

export function PostflightPage({ missionId }: { missionId?: string }) {
  const { t, lang } = useI18n(postflightPageMessages)
  const {
    data: activeData,
    missionId: activeId,
    loading,
    error: queryError,
    postflightMissions = [],
    selectMission,
  } = useActiveMission(missionId)

  const effectiveMissionId = activeData?.id || activeId || ''
  const persistedPostflightQuery = useApiQuery(
    (signal) =>
      effectiveMissionId
        ? fetchLatestPostflightCheck(effectiveMissionId, signal)
        : Promise.resolve(null),
    [effectiveMissionId],
  )
  const missionLabel =
    activeData?.missionCode || effectiveMissionId || t.defaultMissionLabel
  const deviceId = activeData?.deviceId ?? 'DEVICE'
  const deviceLabel = activeData
    ? (formatDeviceLabel(activeData) ?? deviceId)
    : deviceId
  const categories = useMemo(() => postflightCategories(lang), [lang])

  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ResultsState>({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [ticketCreated, setTicketCreated] = useState(false)
  const [liveTelemetrySnapshot, setLiveTelemetrySnapshot] =
    useState<FlightControlStatus | null>(null)
  const [completed, setCompleted] = useState<{
    overallOk: boolean
    ticketCreated: boolean
    droneStatus: string
    failed?: boolean
  } | null>(null)
  const permissionsQuery = useApiQuery(
    () =>
      effectiveMissionId
        ? missionApi.getPermissions(effectiveMissionId)
        : Promise.resolve(null),
    // The inspector permission becomes available after postflight persists
    // actualEndAt, so re-fetch it when this page completes the postflight.
    [effectiveMissionId, Boolean(completed)],
  )

  const items: PostflightItem[] = useMemo(
    () =>
      ALL_KEYS.filter((k) => results[k]).map((k) => ({
        key: k,
        result: results[k] as PreflightItemResult,
      })),
    [results],
  )

  const summary = postflightSummary(items, ALL_KEYS.length)
  const storedTelemetrySnapshot = useMemo(
    () => readPostflightTelemetry(effectiveMissionId),
    [effectiveMissionId],
  )
  const telemetrySnapshot = liveTelemetrySnapshot ?? storedTelemetrySnapshot

  usePostflightTelemetry({
    effectiveMissionId,
    deviceId,
    setLiveTelemetrySnapshot,
  })
  const failItems = useMemo(
    () => ALL_KEYS.filter((k) => results[k] === 'fail'),
    [results],
  )
  const allAssessed = items.length === ALL_KEYS.length
  const inspectionResults = useMemo(() => {
    if (!allAssessed) return null
    const getResult = (key: (typeof ALL_KEYS)[number]): 'PASS' | 'FAIL' =>
      results[key] === 'ok' ? 'PASS' : 'FAIL'
    return {
      a1: getResult('physical_condition_ok'),
      a2: getResult('physical_condition_ok'),
      p1: getResult('motor_ok'),
      p2: getResult('motor_ok'),
      e1: getResult('battery_ok'),
      e4: getResult('battery_ok'),
      e2: getResult('camera_ok'),
      e3: getResult('gps_ok'),
      d1: getResult('communication_ok'),
    }
  }, [allAssessed, results])

  const { handleSetResult, handlePassAll, handleComplete, handleCreateTicket } =
    usePostflightAssessment({
      setResults,
      effectiveMissionId,
      setError,
      allAssessed,
      setSaving,
      activeData,
      results,
      failItems,
      deviceId,
      notes,
      telemetrySnapshot,
      missionLabel,
      setCompleted,
      setTicketSubmitting,
      setNotes,
      setShowTicketDialog,
      setTicketCreated,
    })

  const completedSummary =
    completed ??
    (persistedPostflightQuery.data?.completedAt
      ? {
          overallOk: persistedPostflightQuery.data.overallOk,
          ticketCreated: !persistedPostflightQuery.data.overallOk,
          droneStatus: persistedPostflightQuery.data.overallOk
            ? 'AVAILABLE'
            : 'MAINTENANCE',
          failed: activeData?.status === 'FAILED',
        }
      : null)

  if (
    loading ||
    (!completedSummary &&
      Boolean(effectiveMissionId) &&
      persistedPostflightQuery.loading)
  )
    return <LoadingState />

  if (queryError || !effectiveMissionId) {
    return (
      <EmptyState
        title={t.missionNotFoundTitle}
        description={String(queryError || t.missionNotFoundDesc)}
      />
    )
  }

  if (completedSummary) {
    if (completedSummary.failed || activeData?.status === 'FAILED') {
      return (
        <EmptyState
          title={t.missionFailedTitle}
          description={t.missionFailedDescription}
          action={
            <a
              className="postflight-review-secondary"
              href={operatorHref({ screen: 'missions' })}
            >
              {t.backToMissionList}
            </a>
          }
        />
      )
    }
    if (permissionsQuery.loading) return <LoadingState />
    if (
      permissionsQuery.error ||
      permissionsQuery.data?.canAssessMonitoringChecklist !== true
    ) {
      return (
        <EmptyState
          title={t.reviewInspectorOnlyTitle}
          description={t.reviewInspectorOnlyDescription}
        />
      )
    }
    return (
      <PostflightCompletedView
        key={effectiveMissionId}
        missionId={effectiveMissionId}
        missionLabel={missionLabel}
        completed={completedSummary}
        deviceId={deviceId}
        inspectionResults={inspectionResults}
        notes={notes}
        telemetrySnapshot={telemetrySnapshot}
      />
    )
  }

  return (
    <div className="odm-card postflight-page">
      <PostflightHeader
        missionLabel={missionLabel}
        postflightMissions={postflightMissions}
        effectiveMissionId={effectiveMissionId}
        selectMission={selectMission}
      />

      <div className="postflight-content">
        <div className="postflight-stack">
          {error && <PostflightErrorBanner error={error} />}

          <div className="postflight-overview">
            {telemetrySnapshot && (
              <TelemetrySummary telemetrySnapshot={telemetrySnapshot} />
            )}
            <AssessmentProgress
              failItems={failItems}
              summary={summary}
              allAssessed={allAssessed}
              handlePassAll={handlePassAll}
            />
          </div>

          {/* Inspection Item Categories */}
          <div className="postflight-categories">
            {categories.map((cat, index) => (
              <InspectionCategory
                key={cat.title}
                index={index + 1}
                cat={cat}
                results={results}
                handleSetResult={handleSetResult}
              />
            ))}
          </div>

          {/* Notes Section */}
          <PostflightNotes notes={notes} setNotes={setNotes} />

          {/* Maintenance status */}
          {failItems.length > 0 ? (
            <MaintenanceBanner
              failItems={failItems}
              deviceLabel={deviceLabel}
              setShowTicketDialog={setShowTicketDialog}
              ticketCreated={ticketCreated}
            />
          ) : (
            <TicketCreatedBanner />
          )}

          {/* Action Footer */}
          <PostflightSubmitButton
            saving={saving}
            allAssessed={allAssessed}
            handleComplete={handleComplete}
            failItems={failItems}
          />
        </div>
      </div>

      {showTicketDialog && (
        <MaintenanceTicketDialog
          droneCode={deviceLabel}
          missionId={missionLabel}
          defaultIssueType="PHYSICAL_DAMAGE"
          defaultDescription={t.failedItemsDescription(failItems.join(', '))}
          submitting={ticketSubmitting}
          onCancel={() => setShowTicketDialog(false)}
          onConfirm={handleCreateTicket}
        />
      )}
    </div>
  )
}
