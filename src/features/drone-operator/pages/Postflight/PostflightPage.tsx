import { hasInspectionWorkspaceAccess } from '../../../mission/types/permissions'
import { deviceRoleLabel } from '../../lib/deviceLabel'
import { useEffect, useMemo, useState } from 'react'

import {
  EmptyState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../shared/i18n'
import { useActiveMission } from '../../api/useActiveMission'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { missionApi } from '../../../mission/api/missionApi'
import { operatorHref } from '../../routes'
import type { ManualPostflightReadings } from './manualInspection'
import { postflightSummary } from '../../lib/postflightSummary'
import type { PostflightItem, PreflightItemResult } from '../../types/mission'
import { postflightPageMessages } from './PostflightPage.messages'
import { MaintenanceTicketDialog } from './components/MaintenanceTicketDialog'
import { type ResultsState } from './postflightTypes'
import {
  buildInspectionResults,
  categoryKeys,
  postflightCategoriesFromRun,
} from './postflightHelpers'
import { InputNumber } from 'antd'
import { usePostflightAssessment } from './usePostflightAssessment'
import { fetchLatestPostflightCheck } from '../MissionDetail/checkData'
import { PostflightCompletedView, type DevicePostflightResult } from './components/PostflightCompletedView'
import { PostflightHeader } from './components/PostflightHeader'
import { PostflightErrorBanner } from './components/PostflightErrorBanner'
import { AssessmentProgress } from './components/AssessmentProgress'
import { InspectionCategory } from './components/InspectionCategory'
import { PostflightNotes } from './components/PostflightNotes'
import { MaintenanceBanner } from './components/MaintenanceBanner'
import { TicketCreatedBanner } from './components/TicketCreatedBanner'
import { PostflightSubmitButton } from './components/PostflightSubmitButton'
import '../Preflight/components/PreflightChecklist.css'
import './PostflightPage.css'

export function PostflightPage({ missionId, inspectionOnly = false }: { missionId?: string; inspectionOnly?: boolean }) {
  const { t } = useI18n(postflightPageMessages)
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
  const reloadFleet = () => { mission.reload(); checks.reload() }
  if ((mission.loading && !mission.data) || (assignments.length > 0 && checks.loading && !checks.data)) return <LoadingState />
  if (!id) return <EmptyState title={t.missionNotFoundTitle} description={t.missionNotFoundDesc} />
  if (mission.error || checks.error) return <EmptyState title={t.fleetLoadFailed} description={t.fleetLoadFailedHint}
    action={<button type="button" className="odm-btn" onClick={reloadFleet}>{t.fleetRetry}</button>} />
  if (!assignments.length) return <EmptyState title={t.fleetNoDevices} description={t.fleetNoDevicesHint}
    action={<button type="button" className="odm-btn" onClick={reloadFleet}>{t.fleetRetry}</button>} />
  const labelFor = (a: typeof assignments[number]) => a.deviceCode ?? a.deviceSerialNumber ?? a.deviceName ?? t.fleetDevice(assignments.indexOf(a) + 1)
  const devicePicker = (
    <section className="preflight-device-picker" aria-label={t.fleetTitle}>
      <div className="preflight-device-picker__heading">
        <div><h1>{t.fleetTitle}</h1><p>{t.fleetHint}</p></div>
        <div className={`preflight-fleet-progress${allDone ? ' is-complete' : ''}`} role="status">
          <strong>{assignments.filter(a => isDone(a.deviceId!)).length}<span> / {assignments.length}</span></strong>
          <span>{t.fleetCounter}</span>
        </div>
      </div>
      <div className="preflight-fleet-track" role="progressbar" aria-label={t.fleetProgress}
        aria-valuemin={0} aria-valuemax={assignments.length || 1} aria-valuenow={assignments.filter(a => isDone(a.deviceId!)).length}>
        <span style={{ width: `${assignments.length ? assignments.filter(a => isDone(a.deviceId!)).length / assignments.length * 100 : 0}%` }} />
      </div>
      <nav className="preflight-device-list" aria-label={t.fleetSelect}>
        {assignments.map((a, index) => <button type="button" key={a.deviceId}
          className={`preflight-device-option${a.deviceId === active?.deviceId ? ' is-selected' : ''}${isDone(a.deviceId!) ? ' is-passed' : ''}`}
          aria-pressed={a.deviceId === active?.deviceId} onClick={() => setSelected(a.deviceId!)}>
          <span className="preflight-device-option__number">{index + 1}</span>
          <span className="preflight-device-option__copy">
            <strong>{labelFor(a)}</strong>
            <span>{deviceRoleLabel(a.deviceRole)}{a.deviceId === active?.deviceId ? ` · ${t.fleetSelected}` : ''}</span>
          </span>
          <span className="preflight-device-option__status">{isDone(a.deviceId!) ? t.fleetChecked : t.fleetNeedsCheck}</span>
        </button>)}
      </nav>

    </section>
  )
  return <div className="postflight-workspace">
    {!inspectionOnly && !allDone && devicePicker}
    <PostflightDevicePage key={`${id}:${active?.deviceId ?? ''}`} missionId={missionId}
      inspectionOnly={inspectionOnly}
      selectedDeviceId={active?.deviceId ?? undefined} selectedDeviceLabel={active ? labelFor(active) : undefined}
      deviceChecks={assignments.map(a => ({
        id: a.deviceId!,
        label: labelFor(a),
        check: checks.data?.find(c => c.deviceId === a.deviceId)?.check,
      }))}
      allDevicesDone={allDone} onSaved={onSaved} />
  </div>
}

function PostflightDevicePage({ inspectionOnly, missionId, selectedDeviceId, selectedDeviceLabel, deviceChecks, allDevicesDone, onSaved }: {
  inspectionOnly?: boolean
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
  const runItems = persistedPostflightQuery.data?.items
  const categories = useMemo(
    () => postflightCategoriesFromRun(lang, runItems),
    [lang, runItems],
  )
  const allKeys = useMemo(() => categoryKeys(categories), [categories])

  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ResultsState>({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [ticketCreated, setTicketCreated] = useState(false)
  const [landingBattery, setLandingBattery] = useState<number | null>(null)
  const [completed, setCompleted] = useState<{
    overallOk: boolean
    ticketCreated: boolean
    droneStatus: string
    failed?: boolean
  } | null>(null)
  const permissionsQuery = useApiQuery(
    async () => ({
      missionId: effectiveMissionId,
      fleetComplete: allDevicesDone,
      permissions: effectiveMissionId ? await missionApi.getPermissions(effectiveMissionId) : null,
    }),
    // The inspector permission becomes available after postflight persists
    // actualEndAt, so re-fetch it when this page completes the postflight.
    [effectiveMissionId, Boolean(completed), allDevicesDone],
  )

  const items: PostflightItem[] = useMemo(
    () =>
      allKeys.filter((k) => results[k]).map((k) => ({
        key: k,
        result: results[k] as PreflightItemResult,
      })),
    [allKeys, results],
  )

  const summary = postflightSummary(items, allKeys.length)
  // Only the operator-entered battery value is submitted; no controller reads.
  const telemetrySnapshot: ManualPostflightReadings | null = landingBattery === null
    ? null : { batteryPercent: landingBattery }
  const failItems = useMemo(
    () => allKeys.filter((k) => results[k] === 'fail'),
    [allKeys, results],
  )
  const allAssessed = items.length === allKeys.length
  const inspectionResults = useMemo(() => {
    if (!allAssessed) return null
    return buildInspectionResults(categories, results)
  }, [allAssessed, categories, results])

  const { handleSetResult, handlePassAll, handleComplete, handleCreateTicket } =
    usePostflightAssessment({
      onSaved,
      setResults,
      effectiveMissionId,
      setError,
      allAssessed: allAssessed && landingBattery !== null,
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
      categories,
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

  const permissionsReady = !permissionsQuery.loading && !permissionsQuery.error
    && permissionsQuery.data?.missionId === effectiveMissionId
    && permissionsQuery.data?.fleetComplete === allDevicesDone
  const permissions = permissionsReady ? permissionsQuery.data?.permissions : null
  const nextScreen = !inspectionOnly && allDevicesDone && completedSummary
    && !completedSummary.failed && activeData?.status !== 'FAILED' && !activeData?.failureRequestedAt
    && permissions
      ? hasInspectionWorkspaceAccess(permissions) ? 'inspection'
        : permissions.canAttachChecklistEvidence || permissions.canExecuteMonitoringChecklist ? 'missionDetail' : null
      : null
  useEffect(() => {
    if (nextScreen) window.location.hash = operatorHref({ screen: nextScreen, missionId: effectiveMissionId })
  }, [nextScreen, effectiveMissionId])

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
    if (inspectionOnly) return <EmptyState title={t.inspectionAwaitingPostflight} description={t.inspectionAwaitingPostflightHint} action={<a className="odm-btn" href={operatorHref({ screen: 'postflight', missionId: effectiveMissionId })}>{t.inspectionOpenPostflight}</a>} />
    return <EmptyState title={t.fleetDeviceDone} description={t.fleetChooseRemaining(deviceLabel)} />
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
    if (permissionsQuery.loading || nextScreen) return <LoadingState />
    if (permissionsQuery.error || !permissions) {
      return <EmptyState title={t.reviewPermissionsFailedTitle} description={t.reviewPermissionsFailedDescription}
        action={<button type="button" className="odm-btn" onClick={permissionsQuery.reload}>{t.reviewPermissionsRetry}</button>} />
    }
    const canOpenInspection = hasInspectionWorkspaceAccess(permissions)
    if (!canOpenInspection) {
      return <EmptyState title={t.reviewInspectorOnlyTitle} description={t.reviewInspectorOnlyDescription}
        action={<a className="odm-btn" href={operatorHref({ screen: 'missionDetail', missionId: effectiveMissionId })}>{t.reviewMissionInfo}</a>} />
    }
    return (
      <PostflightCompletedView
        key={effectiveMissionId}
        missionId={effectiveMissionId}
        missionLabel={missionLabel}
        completed={completedSummary}
        inspectionOnly={inspectionOnly}
        deviceChecks={deviceChecks}
        deviceId={deviceId}
        inspectionResults={inspectionResults}
        notes={notes}
        telemetrySnapshot={telemetrySnapshot}
      />
    )
  }

  if (inspectionOnly) return <EmptyState title={t.inspectionAwaitingPostflight}
    description={t.inspectionAwaitingPostflightHint}
    action={<a className="odm-btn" href={operatorHref({ screen: 'postflight', missionId: effectiveMissionId })}>{t.inspectionOpenPostflight}</a>} />

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

          <div className="postflight-selected-device"><strong>{deviceLabel}</strong><span>{t.deviceInspecting}</span></div>
          <div className="postflight-overview">
            <div className="postflight-manual-battery">
              <label htmlFor="postflight-landing-battery">{t.landingBattery} (%) <span aria-hidden="true">*</span></label>
              <InputNumber id="postflight-landing-battery" min={0} max={100} precision={1}
                value={landingBattery} onChange={setLandingBattery} placeholder="0–100"
                addonAfter="%" aria-required="true" style={{ width: 180 }} />
              <small>Nhập mức pin thực tế của thiết bị sau khi bay.</small>
            </div>
            <AssessmentProgress
              failItems={failItems}
              summary={summary}
              total={allKeys.length}
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
          defaultDescription={t.failedItemsDescription(
            failItems
              .map(
                (key) =>
                  categories
                    .flatMap((c) => c.items)
                    .find((item) => item.key === key)?.label ?? key,
              )
              .join(', '),
          )}
          submitting={ticketSubmitting}
          onCancel={() => setShowTicketDialog(false)}
          onConfirm={handleCreateTicket}
        />
      )}
    </div>
  )
}
