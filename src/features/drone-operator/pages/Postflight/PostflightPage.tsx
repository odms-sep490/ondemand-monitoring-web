import { deviceRoleLabel } from '../../lib/deviceLabel'
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
import { PostflightCompletedView, type DevicePostflightResult } from './components/PostflightCompletedView'
import { PostflightHeader } from './components/PostflightHeader'
import { PostflightErrorBanner } from './components/PostflightErrorBanner'
import { TelemetrySummary } from './components/TelemetrySummary'
import { AssessmentProgress } from './components/AssessmentProgress'
import { InspectionCategory } from './components/InspectionCategory'
import { PostflightNotes } from './components/PostflightNotes'
import { MaintenanceBanner } from './components/MaintenanceBanner'
import { TicketCreatedBanner } from './components/TicketCreatedBanner'
import { PostflightSubmitButton } from './components/PostflightSubmitButton'
import '../Preflight/components/PreflightChecklist.css'
import './PostflightPage.css'

export function PostflightPage({ missionId }: { missionId?: string }) {
  const mission = useActiveMission(missionId)
  const [selected, setSelected] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const assignments = (mission.data?.deviceAssignments ?? []).filter(a => a.deviceId)
  const id = mission.data?.id ?? mission.missionId ?? ''
  const checks = useApiQuery(async (signal) => Promise.all(assignments.map(async a => ({
    deviceId: a.deviceId!, check: await fetchLatestPostflightCheck(id, signal, a.deviceId!),
  }))), [id, assignments.map(a => a.deviceId).join(':'), revision])
  const isDone = (deviceId: string) => checks.data?.some(c => c.deviceId === deviceId && c.check?.completedAt)
  const active = assignments.find(a => a.deviceId === selected) ?? assignments.find(a => !isDone(a.deviceId!)) ?? assignments[0]
  const allDone = assignments.length > 0 && assignments.every(a => isDone(a.deviceId!))
  async function onSaved() {
    const latest = await Promise.all(assignments.map(async a => ({ deviceId: a.deviceId!, check: await fetchLatestPostflightCheck(id, undefined, a.deviceId!) })))
    const pending = latest.find(c => !c.check?.completedAt)
    setRevision(v => v + 1)
    mission.reload()
    if (pending) { setSelected(pending.deviceId); return false }
    return true
  }
  const devicePicker = (
    <section className="preflight-device-picker" aria-label="Thiết bị kiểm tra sau bay">
      <div className="preflight-device-picker__heading">
        <div><h1>Kiểm tra sau bay</h1><p>Kiểm tra từng thiết bị và ghi nhận tình trạng sau chuyến bay trước khi nghiệm thu.</p></div>
        <div className={`preflight-fleet-progress${allDone ? ' is-complete' : ''}`} role="status">
          <strong>{assignments.filter(a => isDone(a.deviceId!)).length}<span> / {assignments.length}</span></strong>
          <span>thiết bị đã kiểm tra</span>
        </div>
      </div>
      <div className="preflight-fleet-track" role="progressbar" aria-label="Tiến độ kiểm tra sau bay"
        aria-valuemin={0} aria-valuemax={assignments.length || 1} aria-valuenow={assignments.filter(a => isDone(a.deviceId!)).length}>
        <span style={{ width: `${assignments.length ? assignments.filter(a => isDone(a.deviceId!)).length / assignments.length * 100 : 0}%` }} />
      </div>
      <nav className="preflight-device-list" aria-label="Chọn thiết bị kiểm tra sau bay">
        {assignments.map((a, index) => <button type="button" key={a.deviceId}
          className={`preflight-device-option${a.deviceId === active?.deviceId ? ' is-selected' : ''}${isDone(a.deviceId!) ? ' is-passed' : ''}`}
          aria-pressed={a.deviceId === active?.deviceId} onClick={() => setSelected(a.deviceId!)}>
          <span className="preflight-device-option__number">{index + 1}</span>
          <span className="preflight-device-option__copy">
            <strong>{a.deviceCode ?? a.deviceSerialNumber ?? a.deviceId}</strong>
            <span>{deviceRoleLabel(a.deviceRole)}{a.deviceId === active?.deviceId ? ' · Đang chọn' : ''}</span>
          </span>
          <span className="preflight-device-option__status">{isDone(a.deviceId!) ? 'Đã kiểm tra' : 'Cần kiểm tra'}</span>
        </button>)}
      </nav>
      {checks.error ? <p role="alert">Không tải được kết quả kiểm tra. <button type="button" className="odm-btn" onClick={() => setRevision(v => v + 1)}>Thử lại</button></p> : null}
    </section>
  )
  return <div className="postflight-workspace">
    {!allDone && devicePicker}
    <PostflightDevicePage key={`${id}:${active?.deviceId ?? ''}`} missionId={missionId}
      selectedDeviceId={active?.deviceId ?? undefined} selectedDeviceLabel={active?.deviceCode ?? active?.deviceSerialNumber ?? undefined}
      deviceChecks={assignments.map(a => ({
        id: a.deviceId!,
        label: a.deviceCode ?? a.deviceSerialNumber ?? a.deviceId!,
        check: checks.data?.find(c => c.deviceId === a.deviceId)?.check,
      }))}
      allDevicesDone={allDone} onSaved={onSaved} />
  </div>
}

function PostflightDevicePage({ missionId, selectedDeviceId, selectedDeviceLabel, deviceChecks, allDevicesDone, onSaved }: {
  deviceChecks: DevicePostflightResult[]
  missionId?: string; selectedDeviceId?: string; selectedDeviceLabel?: string; allDevicesDone: boolean; onSaved: () => Promise<boolean>
}) {
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
        ? fetchLatestPostflightCheck(effectiveMissionId, signal, selectedDeviceId)
        : Promise.resolve(null),
    [effectiveMissionId, selectedDeviceId],
  )
  const missionLabel =
    activeData?.missionCode || effectiveMissionId || t.defaultMissionLabel
  const deviceId = selectedDeviceId ?? activeData?.deviceId ?? 'DEVICE'
  const deviceLabel = selectedDeviceLabel ?? deviceId
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
      onSaved,
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

  if (completedSummary && !allDevicesDone) {
    return <div className="odm-card" role="status">Thiết bị {deviceLabel} đã được kiểm tra sau bay. Chọn thiết bị còn lại để tiếp tục.</div>
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
      (permissionsQuery.data?.canAssessMonitoringChecklist !== true &&
        permissionsQuery.data?.canConfirmMissionFailure !== true)
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
        deviceChecks={deviceChecks}
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

          <div className="postflight-selected-device"><strong>{deviceLabel}</strong><span>Thiết bị đang kiểm tra</span></div>
          <div className="postflight-overview">
            {deviceId === activeData?.deviceId && telemetrySnapshot && (
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
