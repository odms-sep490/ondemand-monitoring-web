import { OrderIcon } from '../../../components/common/OrderIcon'
import { formatLocalInput } from '../createMissionHelpers'
import { missionCreatePageMessages } from '../MissionCreatePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { SubmitState } from '../createMissionTypes'
import type { Dispatch, SetStateAction } from 'react'

export function FlightScheduleCard({
  durationText,
  canFillFromCustomer,
  fillFromCustomer,
  scheduledStart,
  setScheduledStart,
  scheduledEnd,
  setScheduledEnd,
  submit,
  scopeLabel,
}: {
  durationText: string | null
  canFillFromCustomer: boolean
  fillFromCustomer: () => void
  scheduledStart: string
  setScheduledStart: Dispatch<SetStateAction<string>>
  scheduledEnd: string
  setScheduledEnd: Dispatch<SetStateAction<string>>
  submit: SubmitState
  scopeLabel: string
}) {
  const { t } = useI18n(missionCreatePageMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="clock" size={18} />
          {t.flightSchedule}
        </span>
        {durationText ? (
          <span className="odm-or-pill odm-or-pill-blue">
            {t.durationLabel(durationText)}
          </span>
        ) : null}
      </header>
      <div className="odm-or-card-body">
        <p className="odm-or-muted odm-or-hint">{t.flightScheduleHint}</p>
        {canFillFromCustomer ? (
          <button
            type="button"
            className="odm-or-quickfill"
            onClick={fillFromCustomer}
          >
            {t.fillFromCustomer}
          </button>
        ) : null}
        <div className="odm-or-form-row">
          <label className="odm-or-field">
            <span className="odm-or-field-label">{t.start}</span>
            <input
              className="odm-or-input"
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
            />
          </label>
          <label className="odm-or-field">
            <span className="odm-or-field-label">{t.end}</span>
            <input
              className="odm-or-input"
              type="datetime-local"
              min={scheduledStart || undefined}
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
            />
          </label>
        </div>
        {scheduledStart && scheduledEnd ? (
          <p className="odm-or-schedule-summary">
            {t.scheduleSummary(
              formatLocalInput(scheduledStart),
              formatLocalInput(scheduledEnd),
            )}
          </p>
        ) : null}
        {submit.kind === 'validationFailed' && scopeLabel.trim() ? (
          <div role="alert" className="odm-or-error">
            {submit.message}
          </div>
        ) : null}
      </div>
    </section>
  )
}
