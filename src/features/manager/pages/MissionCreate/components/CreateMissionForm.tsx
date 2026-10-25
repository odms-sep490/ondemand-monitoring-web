import type { OrderMissionBrief } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { missionCreatePageMessages } from '../MissionCreatePage.messages'
import { orderReviewPageMessages } from '../../OrderReview/OrderReviewPage.messages'
import { planningPresentationMessages } from '../../../components/common/planningPresentation.messages'
import {
  humanizeMediaRequirement,
  formatOrderCode,
} from '../../../components/common/format'
import { useState, useEffect, useMemo } from 'react'
import {
  dateRangeFromBrief,
  forecastTimeFromBrief,
  toLocalInput,
  formatDateLabel,
} from '../createMissionHelpers'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../../api/planningApi'
import { missionsApi } from '../../../api/missionsApi'
import type { SubmitState, ForecastRow } from '../createMissionTypes'
import { customerApi } from '../../../../customer/api/customerApi'
import { OrderWorkflowStepper } from '../../../components/common/OrderWorkflowStepper'
import { useCreateMissionSubmit } from '../useCreateMissionSubmit'
import { deriveCreateMissionSummary } from '../deriveCreateMissionSummary'
import { PlanFailedState } from './PlanFailedState'
import { PlanningContextCard } from './PlanningContextCard'
import { CustomerTimeWindowCard } from './CustomerTimeWindowCard'
import { WeatherForecastCard } from './WeatherForecastCard'
import { FlightScheduleCard } from './FlightScheduleCard'
import { OrderSummaryCard } from './OrderSummaryCard'
import { MissionCreateActionBar } from './MissionCreateActionBar'
import { MissionChecklistSelectionCard } from './MissionChecklistSelectionCard'

export function CreateMissionForm({
  orderId,
  brief,
  now,
  replacesMissionId,
  onCreated,
}: {
  orderId: string
  brief: OrderMissionBrief
  now: Date
  replacesMissionId?: string
  onCreated?: (missionId: string) => void
}) {
  const { t } = useI18n(missionCreatePageMessages)
  const { t: reviewT } = useI18n(orderReviewPageMessages)
  const { t: planningT } = useI18n(planningPresentationMessages)
  const localizeMediaLabel = (label: string) =>
    humanizeMediaRequirement(label, reviewT)
  void now

  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [weatherCheckDate, setWeatherCheckDate] = useState(
    () => dateRangeFromBrief(brief)[0] ?? '',
  )
  const [weatherCheckTime, setWeatherCheckTime] = useState(() =>
    forecastTimeFromBrief(brief),
  )
  const [planRevision, setPlanRevision] = useState(
    brief.executionPlanRevision ?? 0,
  )
  const [scopeLabel, setScopeLabel] = useState('Whole Order scope')
  const planQuery = useApiQuery(
    (signal) => planningApi.getExecutionPlan(orderId, signal),
    [orderId],
  )
  const replacementQuery = useApiQuery(
    (signal) =>
      replacesMissionId
        ? missionsApi.getMissionResponse(replacesMissionId, signal)
        : Promise.resolve(null),
    [replacesMissionId],
  )
  useEffect(() => {
    if (planQuery.data) setPlanRevision(planQuery.data.revision)
  }, [planQuery.data])

  // Prefill scope label and schedule from the original cancelled mission
  useEffect(() => {
    if (!replacementQuery.data) return
    if (replacementQuery.data.scopeLabel) {
      setScopeLabel(replacementQuery.data.scopeLabel)
    }
    if (replacementQuery.data.scheduledStartAt) {
      const d = new Date(replacementQuery.data.scheduledStartAt)
      if (!Number.isNaN(d.getTime())) {
        setScheduledStart(toLocalInput(d))
        const p = (n: number) => String(n).padStart(2, '0')
        setWeatherCheckDate(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`)
        setWeatherCheckTime(`${p(d.getHours())}:${p(d.getMinutes())}`)
      }
    }
    if (replacementQuery.data.scheduledEndAt) {
      const d = new Date(replacementQuery.data.scheduledEndAt)
      if (!Number.isNaN(d.getTime())) {
        setScheduledEnd(toLocalInput(d))
      }
    }
  }, [replacementQuery.data])

  const checklistItems = useMemo(
    () => brief.checklistItems ?? [],
    [brief.checklistItems],
  )
  const uncoveredIds = useMemo(() => {
    if (!planQuery.data) return []
    return planQuery.data.coverage?.uncoveredItemIds ?? []
  }, [planQuery.data])

  const [selectedChecklistIds, setSelectedChecklistIds] = useState<string[]>([])
  const [hasInitializedChecklist, setHasInitializedChecklist] = useState(false)

  // Default selection: automatically select uncovered items (or all items if first mission)
  useEffect(() => {
    if (hasInitializedChecklist || checklistItems.length === 0) return
    if (uncoveredIds.length > 0) {
      setSelectedChecklistIds(uncoveredIds)
      setHasInitializedChecklist(true)
    } else if (planQuery.data) {
      setSelectedChecklistIds(checklistItems.map((i) => i.id))
      setHasInitializedChecklist(true)
    }
  }, [hasInitializedChecklist, checklistItems, uncoveredIds, planQuery.data])

  const handleToggleChecklist = (id: string) => {
    setHasInitializedChecklist(true)
    setSelectedChecklistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
    if (submit.kind === 'validationFailed') {
      setSubmit({ kind: 'idle' })
    }
  }

  const handleSelectAllChecklist = () => {
    setHasInitializedChecklist(true)
    setSelectedChecklistIds(checklistItems.map((i) => i.id))
    if (submit.kind === 'validationFailed') {
      setSubmit({ kind: 'idle' })
    }
  }

  const handleSelectUncoveredChecklist = () => {
    setHasInitializedChecklist(true)
    const availableUncovered = checklistItems
      .filter((i) => uncoveredIds.includes(i.id))
      .map((i) => i.id)
    setSelectedChecklistIds(
      availableUncovered.length > 0
        ? availableUncovered
        : checklistItems.map((i) => i.id),
    )
    if (submit.kind === 'validationFailed') {
      setSubmit({ kind: 'idle' })
    }
  }

  const handleDeselectAllChecklist = () => {
    setHasInitializedChecklist(true)
    setSelectedChecklistIds([])
  }
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' })
  const [navigateTo, setNavigateTo] = useState<string | null>(null)
  const fillFromCustomer = () => {
    const first = dateRangeFromBrief(brief)[0]
    if (!first) return
    const start = new Date(`${first}T${forecastTimeFromBrief(brief)}`)
    if (Number.isNaN(start.getTime())) return
    setScheduledStart(toLocalInput(start))
    setScheduledEnd(toLocalInput(new Date(start.getTime() + 60 * 60 * 1000)))
    setSubmit({ kind: 'idle' })
  }

  const forecastDates = useMemo(
    () =>
      onCreated
        ? weatherCheckDate
          ? [weatherCheckDate]
          : []
        : dateRangeFromBrief(brief),
    [brief, onCreated, weatherCheckDate],
  )
  const forecastTime = onCreated
    ? weatherCheckTime
    : forecastTimeFromBrief(brief)
  const [forecastRows, setForecastRows] = useState<ForecastRow[]>(() =>
    forecastDates.map((date) => ({
      date,
      label: formatDateLabel(date),
      status: 'loading',
    })),
  )

  useEffect(() => {
    if (!brief.center || forecastDates.length === 0) {
      setForecastRows([])
      return
    }
    let cancelled = false
    setForecastRows(
      forecastDates.map((date) => ({
        date,
        label: formatDateLabel(date),
        status: 'loading',
      })),
    )
    Promise.all(
      forecastDates.map(async (date): Promise<ForecastRow> => {
        try {
          const forecast = await customerApi.getWeatherForecast({
            latitude: brief.center!.lat,
            longitude: brief.center!.lon,
            date,
            time: forecastTime,
          })
          return forecast.status === 'AVAILABLE'
            ? { date, label: formatDateLabel(date), status: 'ready', forecast }
            : { date, label: formatDateLabel(date), status: 'unavailable' }
        } catch {
          return { date, label: formatDateLabel(date), status: 'error' }
        }
      }),
    ).then((rows) => {
      if (!cancelled) setForecastRows(rows)
    })
    return () => {
      cancelled = true
    }
  }, [brief.center, forecastDates, forecastTime])

  if (navigateTo) {
    window.location.hash = navigateTo
    return null
  }

  const { handleSubmit } = useCreateMissionSubmit({
    submit,
    planQuery,
    replacementQuery,
    replacesMissionId,
    orderId,
    scopeLabel,
    selectedChecklistIds,
    hasChecklistItems: checklistItems.length > 0,
    setSubmit,
    planningT,
    scheduledStart,
    scheduledEnd,
    t,
    planRevision,
    onCreated,
    setNavigateTo,
    setPlanRevision,
  })

  if (submit.kind === 'planFailed') {
    return (
      <div className="odm-or">
        {!onCreated && <OrderWorkflowStepper currentStep={5} />}
        <PlanFailedState submit={submit} setSubmit={setSubmit} />
      </div>
    )
  }

  const { durationText, submitting, summaryRows } = deriveCreateMissionSummary({
    scheduledStart,
    scheduledEnd,
    t,
    submit,
    brief,
  })

  return (
    <div className={`odm-or odm-plan-page${onCreated ? ' is-embedded' : ''}`}>
      {!onCreated && (
        <div className="odm-or-pagehead">
          <h1 className="odm-or-title">{t.title}</h1>
          <p className="odm-or-subtitle">
            {t.fromOrder(
              formatOrderCode(brief.code),
              brief.serviceName,
              brief.customerFullName,
            )}
          </p>
        </div>
      )}

      {!onCreated && <OrderWorkflowStepper currentStep={5} />}

      <PlanningContextCard
        onCreated={onCreated}
        planQuery={planQuery}
        planRevision={planRevision}
        orderId={orderId}
        scopeLabel={scopeLabel}
        setScopeLabel={setScopeLabel}
        submit={submit}
        replacesMissionId={replacesMissionId}
        replacementQuery={replacementQuery}
      />

      <div className="odm-or-grid">
        <div className="odm-or-col">
          <CustomerTimeWindowCard brief={brief} />

          <WeatherForecastCard
            onCreated={onCreated}
            forecastTime={forecastTime}
            weatherCheckDate={weatherCheckDate}
            setWeatherCheckDate={setWeatherCheckDate}
            weatherCheckTime={weatherCheckTime}
            setWeatherCheckTime={setWeatherCheckTime}
            brief={brief}
            forecastRows={forecastRows}
          />

          <FlightScheduleCard
            durationText={durationText}
            forecastRows={forecastRows}
            fillFromCustomer={fillFromCustomer}
            scheduledStart={scheduledStart}
            setScheduledStart={setScheduledStart}
            scheduledEnd={scheduledEnd}
            setScheduledEnd={setScheduledEnd}
            submit={submit}
            scopeLabel={scopeLabel}
          />

          <MissionChecklistSelectionCard
            items={checklistItems}
            plan={planQuery.data ?? null}
            selectedIds={selectedChecklistIds}
            onToggle={handleToggleChecklist}
            onSelectAll={handleSelectAllChecklist}
            onSelectUncovered={handleSelectUncoveredChecklist}
            onDeselectAll={handleDeselectAllChecklist}
            error={
              submit.kind === 'validationFailed' &&
              selectedChecklistIds.length === 0
                ? submit.message
                : undefined
            }
          />
        </div>

        <div className="odm-or-col">
          <OrderSummaryCard
            summaryRows={summaryRows}
            brief={brief}
            localizeMediaLabel={localizeMediaLabel}
          />
        </div>
      </div>

      <MissionCreateActionBar
        handleSubmit={handleSubmit}
        submitting={submitting}
        planQuery={planQuery}
        replacementQuery={replacementQuery}
        replacesMissionId={replacesMissionId}
        orderId={orderId}
      />
    </div>
  )
}
