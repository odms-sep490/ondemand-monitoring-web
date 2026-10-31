import { CloseOutlined, EditOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { missionsApi } from '../../api/missionsApi'
import { customerApi } from '../../../customer/api/customerApi'
import { planningError } from '../../lib/planningErrors'
import { useI18n } from '../../../../shared/i18n'
import { missionCreatePageMessages } from '../../pages/MissionCreate/MissionCreatePage.messages'
import { orderReviewPageMessages } from '../../pages/OrderReview/OrderReviewPage.messages'
import { humanizeMediaRequirement } from './format'
import { OrderIcon } from './OrderIcon'
import { missionUpdatePanelMessages } from './MissionUpdatePanel.messages'
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
  disabled,
  onUpdated,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: MissionUpdatePanelProps) {
  const { t } = useI18n(missionCreatePageMessages)
  const { t: reviewT } = useI18n(orderReviewPageMessages)
  const { t: tu } = useI18n(missionUpdatePanelMessages)
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
        checklistIds: selected,
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
        <div
          className="odm-planning-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeForm()
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label={tu.editTitle(mission.missionCode ?? '')}
        >
          <div
            className="odm-planning-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="odm-planning-create-head">
              <span className="odm-planning-create-icon" aria-hidden="true">
                <EditOutlined />
              </span>
              <div>
                <h3>{tu.heading(mission.missionCode ?? '')}</h3>
                <p>{tu.subtitle}</p>
              </div>
              <button
                className="odm-planning-create-close"
                type="button"
                aria-label={tu.closeAria}
                title={tu.closeTitle}
                onClick={closeForm}
              >
                <CloseOutlined aria-hidden="true" />
              </button>
            </header>

            <div className="odm-planning-modal-body">
              <div className="odm-or odm-plan-page is-embedded">
                <section
                  className="odm-or-card odm-plan-create"
                  aria-label={tu.contextAria}
                >
                  <div className="odm-plan-create-body">
                    <div className="odm-plan-create-grid">
                      <div className="odm-plan-form">
                        <h3>{tu.scopeHeading}</h3>
                        <p className="odm-plan-description">
                          {tu.scopeDescription}
                        </p>
                        <div className="odm-or-field">
                          <span className="odm-or-field-label">
                            {tu.scopeFieldLabel}
                          </span>
                          <input
                            className="odm-or-input"
                            readOnly
                            value={
                              mission.scopeLabel ||
                              mission.orderTitle ||
                              tu.scopeFallback
                            }
                          />
                        </div>
                      </div>
                      <aside
                        className="odm-plan-geography"
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
                              {plan.planStatus} ({tu.planVersion(plan.revision)}
                              )
                            </strong>
                          </li>
                          <li>
                            {tu.location}{' '}
                            <strong>
                              {brief.addressText || tu.locationFallback}
                            </strong>
                          </li>
                        </ul>
                      </aside>
                    </div>
                  </div>
                </section>

                <div className="odm-or-grid">
                  <div className="odm-or-col">
                    <CustomerTimeWindowCard brief={brief} />

                    <WeatherForecastCard
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
                      canFillFromCustomer={Boolean(
                        dateRangeFromBrief(brief)[0],
                      )}
                      fillFromCustomer={fillFromCustomer}
                      scheduledStart={scheduledStart}
                      setScheduledStart={setScheduledStart}
                      scheduledEnd={scheduledEnd}
                      setScheduledEnd={setScheduledEnd}
                      submit={submit}
                      scopeLabel={
                        mission.scopeLabel || mission.missionCode || ''
                      }
                    />

                    <MissionChecklistSelectionCard
                      items={orderChecklistItems}
                      plan={plan}
                      selectedIds={selected}
                      onToggle={handleToggleChecklist}
                      onSelectAll={handleSelectAllChecklist}
                      onSelectUncovered={handleSelectUncoveredChecklist}
                      onDeselectAll={handleDeselectAllChecklist}
                      error={
                        submit.kind === 'validationFailed' &&
                        selected.length === 0
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

                <div className="odm-or-actionbar">
                  <div className="odm-or-actionbar-hint">
                    <span className="odm-or-actionbar-hint-icon">
                      <OrderIcon name="info" size={18} />
                    </span>
                    <span>
                      {submit.kind === 'validationFailed' ? (
                        <strong className="odm-mcard-error-text">
                          {submit.message}
                        </strong>
                      ) : (
                        tu.actionHint
                      )}
                    </span>
                  </div>
                  <div className="odm-or-actionbar-actions">
                    <button
                      type="button"
                      className="odm-or-btn odm-or-btn-ghost"
                      disabled={submitting}
                      onClick={closeForm}
                    >
                      {tu.cancel}
                    </button>
                    <button
                      type="button"
                      className="odm-or-btn odm-or-btn-primary"
                      disabled={submitting}
                      onClick={() => void handleSubmit()}
                    >
                      {submitting ? tu.saving : tu.save}
                      <OrderIcon name="chevron-right" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
