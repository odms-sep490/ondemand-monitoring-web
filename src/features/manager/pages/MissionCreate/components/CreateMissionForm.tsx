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
import type { SubmitState, ForecastRow } from '../createMissionTypes'
import { customerApi } from '../../../../customer/api/customerApi'
import { OrderWorkflowStepper } from '../../../components/common/OrderWorkflowStepper'
import { useCreateMissionSubmit } from '../useCreateMissionSubmit'
import { deriveCreateMissionSummary } from '../deriveCreateMissionSummary'
import { PageHeader } from '../../../components/common/PageHeader'
import '../missionCreate.scss'
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
  onCreated,
}: {
  orderId: string
  brief: OrderMissionBrief
  now: Date
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
  useEffect(() => {
    if (planQuery.data) setPlanRevision(planQuery.data.revision)
  }, [planQuery.data])

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

  // Start with uncovered items only; already assigned checks require an explicit repeat selection.
  useEffect(() => {
    if (hasInitializedChecklist || checklistItems.length === 0) return
    if (planQuery.data) {
      setSelectedChecklistIds(uncoveredIds)
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
    setSelectedChecklistIds(availableUncovered)
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

  const { handleSubmit } = useCreateMissionSubmit({
    submit,
    planQuery,
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

  if (navigateTo) {
    window.location.hash = navigateTo
    return null
  }

  if (submit.kind === 'planFailed') {
    return (
      <div className="odm-or mgr-view mgr-mc">
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
    <div
      className={`odm-or odm-plan-page${onCreated ? ' is-embedded' : ' mgr-view mgr-mc'}`}
    >
      {!onCreated && (
        <PageHeader
          title={t.title}
          description={t.fromOrder(
            formatOrderCode(brief.code),
            brief.serviceName,
            brief.customerFullName,
          )}
        />
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
            canFillFromCustomer={Boolean(dateRangeFromBrief(brief)[0])}
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
              selectedChecklistIds.length === 0 &&
              Boolean(scopeLabel.trim()) &&
              Boolean(scheduledStart) &&
              Boolean(scheduledEnd) &&
              new Date(scheduledEnd) > new Date(scheduledStart)
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
      />
    </div>
  )
}
