import { Radio } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  FormState,
  UpdateField,
  WeatherFallback,
} from '../../../lib/createOrder/types'
import { scheduleOptionsCardMessages } from './ScheduleOptionsCard.messages'

type Props = {
  form: FormState
  update: UpdateField
}

const WEATHER: WeatherFallback[] = [
  'AUTO_RESCHEDULE',
  'CONTACT_CUSTOMER',
  'CANCEL_ORDER',
]

/** Flight-incident fallback options for the schedule. */
export function ScheduleOptionsCard({ form, update }: Props) {
  const { t } = useI18n(scheduleOptionsCardMessages)
  const [expanded, setExpanded] = useState(false)
  const open = expanded

  return (
    <section className="co-schedule-options">
      <button
        type="button"
        className="co-schedule-options-toggle"
        aria-expanded={open}
        aria-controls="co-schedule-options-panel"
        onClick={() => setExpanded((current) => !current)}
      >
        <span>
          <strong>{t.expandTitle}</strong>
          <small>{t.cardHint}</small>
        </span>
        <span className="co-schedule-options-chevron" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      <div
        id="co-schedule-options-panel"
        className="co-schedule-options-panel"
        hidden={!open}
      >
        <Card icon={<ClockCircleOutlined />} title={t.cardTitle}>
          <fieldset className="co-opt-group">
            <legend>{t.weatherLegend}</legend>
            <p className="co-help">{t.weatherHint}</p>
            <div className="co-choice-list">
              {WEATHER.map((value) => (
                <Radio
                  key={value}
                  className={`co-choice${form.weatherFallback === value ? ' is-on' : ''}`}
                  name="co-weather"
                  value={value}
                  checked={form.weatherFallback === value}
                  onChange={() => update('weatherFallback', value)}
                >
                  <span>
                    <strong>{t.weather[value].title}</strong>
                    <small>{t.weather[value].desc}</small>
                  </span>
                </Radio>
              ))}
            </div>
          </fieldset>
        </Card>
      </div>
    </section>
  )
}
