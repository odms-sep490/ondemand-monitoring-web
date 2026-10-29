import { useMemo, useState } from 'react'

import { Skeleton } from 'antd'

import { CardComponent, ErrorState } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { useActiveMission } from '../../api/useActiveMission'
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
  } | null>(null)

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

  if (loading)
    return (
      <div className="stf-stack" aria-busy="true">
        <CardComponent>
          <Skeleton active paragraph={{ rows: 1 }} />
        </CardComponent>
        <CardComponent>
          <Skeleton active paragraph={{ rows: 6 }} />
        </CardComponent>
      </div>
    )

  if (queryError || !effectiveMissionId) {
    return (
      <ErrorState
        title={t.missionNotFoundTitle}
        description={String(queryError || t.missionNotFoundDesc)}
      />
    )
  }

  if (completed) {
    return (
      <PostflightCompletedView
        missionLabel={missionLabel}
        completed={completed}
        deviceLabel={deviceLabel}
        failItems={failItems}
      />
    )
  }

  return (
    <CardComponent styles={{ body: { padding: 0 } }}>
      <PostflightHeader
        missionLabel={missionLabel}
        postflightMissions={postflightMissions}
        effectiveMissionId={effectiveMissionId}
        selectMission={selectMission}
        deviceLabel={deviceLabel}
      />

      <div className="stf-pad stf-narrow">
        <div className="stf-stack">
          {error && <PostflightErrorBanner error={error} />}

          {telemetrySnapshot && (
            <TelemetrySummary telemetrySnapshot={telemetrySnapshot} />
          )}

          {/* Progress Header Card */}
          <AssessmentProgress
            failItems={failItems}
            summary={summary}
            allAssessed={allAssessed}
            handlePassAll={handlePassAll}
          />

          {/* Inspection Item Categories */}
          <div className="stf-stack">
            {categories.map((cat) => (
              <InspectionCategory
                key={cat.title}
                cat={cat}
                results={results}
                handleSetResult={handleSetResult}
              />
            ))}
          </div>

          {/* Notes Section */}
          <PostflightNotes notes={notes} setNotes={setNotes} />

          {/* Maintenance Ticket Alert Banner */}
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
    </CardComponent>
  )
}
