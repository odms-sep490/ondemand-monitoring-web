import { EditOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Collapse, Tag } from 'antd'
import { useState, useEffect, useId, useMemo, useCallback } from 'react'
import { missionsApi } from '../../api/missionsApi'
import { customerApi } from '../../../customer/api/customerApi'
import { planningError } from '../../lib/planningErrors'
import { useI18n } from '../../../../shared/i18n'
import { missionCreatePageMessages } from '../../pages/MissionCreate/MissionCreatePage.messages'
import { orderReviewPageMessages } from '../../pages/OrderReview/OrderReviewPage.messages'
import { humanizeMediaRequirement } from './format'
import { OrderIcon } from './OrderIcon'
import { missionUpdatePanelMessages } from './MissionUpdatePanel.messages'
import { PlanningFormModal } from '../../pages/OrderReview/components/PlanningFormModal'
import { TicketResultReviewCard } from '../../../support/components/TicketResultReviewCard'
import type { ResultRevisionCase } from '../../../delivery/api'
import './MissionGridCard.css'
import {
  dateRangeFromBrief,
  forecastTimeFromBrief,
  formatDateLabel,
  toLocalInput,
} from '../../pages/MissionCreate/createMissionHelpers'
import { deriveCreateMissionSummary } from '../../pages/MissionCreate/deriveCreateMissionSummary'
import { CustomerTimeWindowCard } from '../../pages/MissionCreate/components/CustomerTimeWindowCard'
import { WeatherForecastCard } from '../../pages/MissionCreate/components/WeatherForecastCard'
import { FlightScheduleCard } from '../../pages/MissionCreate/components/FlightScheduleCard'
import { OrderSummaryCard } from '../../pages/MissionCreate/components/OrderSummaryCard'
import { MissionChecklistSelectionCard } from '../../pages/MissionCreate/components/MissionChecklistSelectionCard'
import type {
  OrderChecklistSnapshot,
  OrderDetail,
  OrderMissionBrief,
} from '../../types/orders'
import type { ExecutionPlan } from '../../types/planning'
import type { MissionResponse } from '../../types/missions'
import type {
  ForecastRow,
  SubmitState,
} from '../../pages/MissionCreate/createMissionTypes'

function parseToLocal(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return toLocalInput(d)
}

interface MissionUpdatePanelProps {
  mission: MissionResponse
  order: OrderDetail
  plan: ExecutionPlan
  orderChecklistItems: OrderChecklistSnapshot[]
  reworkCase?: ResultRevisionCase
  disabled: boolean
  onUpdated: () => void
  isOpen?: boolean
  onClose?: () => void
}

/** Edit button + popup modal identical in structure to Create Mission. */
export function MissionUpdatePanel({
  mission,
  order,
  plan,
  orderChecklistItems,
  reworkCase,
  disabled,
  onUpdated,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: MissionUpdatePanelProps) {
  const { t } = useI18n(missionCreatePageMessages)
  const { t: reviewT } = useI18n(orderReviewPageMessages)
  const { t: tu } = useI18n(missionUpdatePanelMessages)
  const scopeInputId = useId()
  const rework =
    mission.purpose === 'REWORK' || Boolean(mission.inspectionCorrectionId)
  const internalSupplemental = Boolean(mission.inspectionCorrectionId)
  const localizeMediaLabel = (label: string) =>
    humanizeMediaRequirement(label, reviewT)

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalIsOpen !== undefined
  const open = isControlled ? Boolean(externalIsOpen) : internalOpen

  const closeForm = useCallback(() => {
    if (isControlled) {
      externalOnClose?.()
    } else {
      setInternalOpen(false)
    }
  }, [isControlled, externalOnClose])

  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' })

  // Construct brief from order
  const brief: OrderMissionBrief = useMemo(
    () => ({
      executionPlanRevision: plan?.revision ?? 0,
      checklistItems: orderChecklistItems ?? [],
      id: order?.id ?? '',
      code: order?.code ?? '',
      serviceName: order?.serviceName ?? '',
      customerFullName: order?.customer?.fullName ?? '',
      preferredDate: order?.preferredDate ?? '',
      preferredDateFrom: order?.preferredDateFrom,
      preferredDateTo: order?.preferredDateTo,
      preferredTimeName: order?.preferredTimeName ?? '',
      addressText: order?.addressText,
      center: order?.center,
      radiusM: order?.radiusM,
      nearestBase: order?.nearestBase,
      mediaRequirements: order?.mediaRequirements,
    }),
    [order, plan?.revision, orderChecklistItems],
  )

  const [weatherCheckDate, setWeatherCheckDate] = useState<string>('')
  const [weatherCheckTime, setWeatherCheckTime] = useState<string>('08:00')

  // Find checklists currently assigned to this mission in execution plan
  const missionScope = useMemo(
    () => plan.missions.find((m) => m.missionId === mission.id),
    [plan.missions, mission.id],
  )
  const initialAssignedIds = useMemo(
    () => missionScope?.checklistItemIds ?? [],
    [missionScope],
  )

  const initFormData = useCallback(() => {
    setScheduledStart(parseToLocal(mission.scheduledStartAt))
    setScheduledEnd(parseToLocal(mission.scheduledEndAt))
    setSelected(initialAssignedIds)
    if (mission.scheduledStartAt) {
      const d = new Date(mission.scheduledStartAt)
      if (!Number.isNaN(d.getTime())) {
        const p = (n: number) => String(n).padStart(2, '0')
        setWeatherCheckDate(
          `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
        )
        setWeatherCheckTime(`${p(d.getHours())}:${p(d.getMinutes())}`)
      }
    } else if (rework) {
      setWeatherCheckDate(toLocalInput(new Date()).slice(0, 10))
      setWeatherCheckTime(forecastTimeFromBrief(brief))
    } else {
      const dates = dateRangeFromBrief(brief)
      setWeatherCheckDate(dates[0] ?? '')
      setWeatherCheckTime(forecastTimeFromBrief(brief))
    }
    setSubmit({ kind: 'idle' })
  }, [
    mission.scheduledStartAt,
    mission.scheduledEndAt,
    initialAssignedIds,
    brief,
    rework,
  ])

  // Sync initial data when modal opens
  useEffect(() => {
    if (open) {
      initFormData()
    }
  }, [open, initFormData])

  function openForm() {
    initFormData()
    setInternalOpen(true)
  }

  const fillFromCustomer = () => {
    const first = dateRangeFromBrief(brief)[0]
    if (!first) return
    const start = new Date(`${first}T${forecastTimeFromBrief(brief)}`)
    if (Number.isNaN(start.getTime())) return
    setScheduledStart(toLocalInput(start))
    setScheduledEnd(toLocalInput(new Date(start.getTime() + 60 * 60 * 1000)))
    setSubmit({ kind: 'idle' })
  }

  // Weather forecast rows
  const [forecastRows, setForecastRows] = useState<ForecastRow[]>([])

  const lat = brief.center?.lat
  const lon = brief.center?.lon

  useEffect(() => {
    if (!open || lat == null || lon == null || !weatherCheckDate) {
      setForecastRows([])
      return
    }
    let cancelled = false
    setForecastRows([
      {
        date: weatherCheckDate,
        label: formatDateLabel(weatherCheckDate),
        status: 'loading',
      },
    ])
    customerApi
      .getWeatherForecast({
        latitude: lat,
        longitude: lon,
        date: weatherCheckDate,
        time: weatherCheckTime,
      })
      .then((forecast) => {
        if (cancelled) return
        setForecastRows([
          forecast.status === 'AVAILABLE'
            ? {
                date: weatherCheckDate,
                label: formatDateLabel(weatherCheckDate),
                status: 'ready',
                forecast,
              }
            : {
                date: weatherCheckDate,
                label: formatDateLabel(weatherCheckDate),
                status: 'unavailable',
              },
        ])
      })
      .catch(() => {
        if (cancelled) return
        setForecastRows([
          {
            date: weatherCheckDate,
            label: formatDateLabel(weatherCheckDate),
            status: 'error',
          },
        ])
      })
    return () => {
      cancelled = true
    }
  }, [open, lat, lon, weatherCheckDate, weatherCheckTime])

  const handleToggleChecklist = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
    if (submit.kind === 'validationFailed') {
      setSubmit({ kind: 'idle' })
    }
  }

  const handleSelectAllChecklist = () => {
    setSelected(orderChecklistItems.map((i) => i.id))
    if (submit.kind === 'validationFailed') {
      setSubmit({ kind: 'idle' })
    }
  }

  const handleSelectUncoveredChecklist = () => {
    const uncoveredIds = plan.coverage.uncoveredItemIds ?? []
    const combined = Array.from(
      new Set([...initialAssignedIds, ...uncoveredIds]),
    )
    setSelected(
      combined.length > 0 ? combined : orderChecklistItems.map((i) => i.id),
    )
    if (submit.kind === 'validationFailed') {
      setSubmit({ kind: 'idle' })
    }
  }

  const handleDeselectAllChecklist = () => {
    setSelected([])
  }

  const { durationText, submitting, summaryRows } = deriveCreateMissionSummary({
    scheduledStart,
    scheduledEnd,
    t,
    submit,
    brief,
  })

  async function handleSubmit() {
    if (submitting) return
    if (!scheduledStart || !scheduledEnd) {
      setSubmit({
        kind: 'validationFailed',
        message: t.validationRequired,
      })
      return
    }
    const s = new Date(scheduledStart)
    const e = new Date(scheduledEnd)
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) {
      setSubmit({
        kind: 'validationFailed',
        message: t.validationInvalidRange,
      })
      return
    }
    if (orderChecklistItems.length > 0 && selected.length === 0) {
      setSubmit({
        kind: 'validationFailed',
        message: tu.needChecklist,
      })
      return
    }
    setSubmit({ kind: 'submitting' })
    try {
      await missionsApi.updateMission(mission.id, {
        scheduledStartAt: s.toISOString(),
        scheduledEndAt: e.toISOString(),
        ...(rework ? {} : { checklistIds: selected }),
      })
      closeForm()
      onUpdated()
    } catch (error) {
      setSubmit({
        kind: 'validationFailed',
        message: planningError(error),
      })
    }
  }

  // Lock body scroll while modal is open (if rendered standalone)
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  return (
    <>
      {!isControlled && (
        <button
          type="button"
          className="odm-btn odm-btn-sm"
          disabled={disabled}
          onClick={openForm}
          title={tu.editTitle(mission.missionCode ?? '')}
        >
          <EditOutlined aria-hidden="true" /> {tu.edit}
        </button>
      )}

      {open && (
        <PlanningFormModal
          kind="edit"
          ariaLabel={tu.editTitle(mission.missionCode ?? '')}
          heading={tu.heading(mission.missionCode ?? '')}
          subtitle={tu.subtitle}
          closeAria={tu.closeAria}
          closeTitle={tu.closeTitle}
          onRequestClose={closeForm}
        >
          <div className="odm-or odm-plan-page is-embedded">
            <section
              className="odm-or-card odm-plan-create"
              aria-label={tu.contextAria}
            >
              <div className="odm-plan-create-body">
                <div className="odm-plan-create-grid">
                  <div className="odm-plan-form">
                    <h3>{tu.scopeHeading}</h3>
                    <p className="odm-plan-description">{tu.scopeDescription}</p>
                    <label className="odm-or-field" htmlFor={scopeInputId}>
                      <span className="odm-or-field-label">
                        {tu.scopeFieldLabel}
                      </span>
                    </label>
                    <input
                      id={scopeInputId}
                      className="odm-or-input"
                      readOnly
                      value={
                        mission.scopeLabel ||
                        mission.orderTitle ||
                        tu.scopeFallback
                      }
                    />
                  </div>
                  <aside
                    className="odm-plan-geography is-summary"
                    aria-labelledby="mission-geography-title"
                  >
                    <h3 id="mission-geography-title">
                      <OrderIcon name="info" size={18} />
                      {tu.planInfo}
                    </h3>
                    <ul>
                      <li>
                        {tu.orderCode} <strong>{brief.code}</strong>
                      </li>
                      <li>
                        {tu.planStatus}{' '}
                        <strong>
                          {plan.planStatus} ({tu.planVersion(plan.revision)})
                        </strong>
                      </li>
                      <li>
                        {tu.location}{' '}
                        <strong>{brief.addressText || tu.locationFallback}</strong>
                      </li>
                    </ul>
                  </aside>
                </div>
              </div>
            </section>

            <div className="odm-or-grid">
              <div className="odm-or-col">
                {!rework && <CustomerTimeWindowCard brief={brief} />}
                {rework && (
                  <section className="odm-or-card odm-plan-window">
                    <header className="odm-or-card-head">
                      <span className="odm-or-card-title">
                        <Tag color="orange">
                          {internalSupplemental ? t.internalScope : t.reworkBadge}
                        </Tag>
                        {reworkCase
                          ? t.reworkScopeLabel(reworkCase.ticketCode)
                          : internalSupplemental
                            ? t.internalTitle
                            : mission.scopeLabel || t.reworkBadge}
                      </span>
                    </header>
                    <div className="odm-or-card-body">
                      <p className="odm-or-muted">
                        {internalSupplemental
                          ? t.internalDescription
                          : t.reworkScheduleHelp}
                      </p>
                    </div>
                  </section>
                )}

                <WeatherForecastCard
                  customSchedule={rework}
                  onCreated={() => {}}
                  forecastTime={weatherCheckTime}
                  weatherCheckDate={weatherCheckDate}
                  setWeatherCheckDate={setWeatherCheckDate}
                  weatherCheckTime={weatherCheckTime}
                  setWeatherCheckTime={setWeatherCheckTime}
                  brief={brief}
                  forecastRows={forecastRows}
                />

                <FlightScheduleCard
                  durationText={durationText}
                  canFillFromCustomer={
                    !rework && Boolean(dateRangeFromBrief(brief)[0])
                  }
                  fillFromCustomer={fillFromCustomer}
                  scheduledStart={scheduledStart}
                  setScheduledStart={setScheduledStart}
                  scheduledEnd={scheduledEnd}
                  setScheduledEnd={setScheduledEnd}
                  submit={submit}
                  scopeLabel={mission.scopeLabel || mission.missionCode || ''}
                />

                <MissionChecklistSelectionCard
                  disabled={rework}
                  items={orderChecklistItems}
                  plan={rework ? null : plan}
                  selectedIds={selected}
                  onToggle={handleToggleChecklist}
                  onSelectAll={handleSelectAllChecklist}
                  onSelectUncovered={handleSelectUncoveredChecklist}
                  onDeselectAll={handleDeselectAllChecklist}
                  error={
                    submit.kind === 'validationFailed' && selected.length === 0
                      ? submit.message
                      : undefined
                  }
                />

                {rework && reworkCase?.ticketId && (
                  <Collapse
                    className="odm-plan-feedback"
                    items={[
                      {
                        key: 'feedback',
                        label: t.reworkFeedback,
                        children: (
                          <TicketResultReviewCard
                            ticketId={reworkCase.ticketId}
                          />
                        ),
                      },
                    ]}
                  />
                )}
              </div>

              <div className="odm-or-col">
                <OrderSummaryCard
                  summaryRows={summaryRows}
                  brief={brief}
                  localizeMediaLabel={localizeMediaLabel}
                />
              </div>
            </div>

            {submit.kind === 'validationFailed' && (
              <div role="alert" className="odm-or-error odm-plan-submit-error">
                {submit.message}
              </div>
            )}

            <div className="odm-or-actionbar">
              <div className="odm-or-actionbar-hint">
                <span className="odm-or-actionbar-hint-icon">
                  <OrderIcon name="info" size={18} />
                </span>
                <span>{tu.actionHint}</span>
              </div>
              <div className="odm-or-actionbar-actions">
                <Button
                  htmlType="button"
                  disabled={submitting}
                  onClick={closeForm}
                >
                  {tu.cancel}
                </Button>
                <Button
                  type="primary"
                  htmlType="button"
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? tu.saving : tu.save}
                  <RightOutlined aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </PlanningFormModal>
      )}
    </>
  )
}
