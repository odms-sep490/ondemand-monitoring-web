import { CloudOutlined } from '@ant-design/icons'
import { Alert, Button, Select } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import type {
  WeatherPreflightStatus,
  WeatherObservationForm,
  WeatherCheckStatus,
} from '../preflightTypes'
import { useI18n } from '../../../../../shared/i18n'
import { preflightPageMessages } from '../PreflightPage.messages'
import { WeatherField } from './WeatherField'

export function WeatherCheckPanel({
  status,
  form,
  suggesting,
  error,
  latitude,
  longitude,
  onFormChange,
  onSuggest,
}: {
  status: WeatherPreflightStatus | null
  form: WeatherObservationForm
  suggesting: boolean
  error: string | null
  latitude?: number | null
  longitude?: number | null
  onFormChange: (form: WeatherObservationForm) => void
  onSuggest: () => void
}) {
  const { t } = useI18n(preflightPageMessages)
  const failed = status?.status === 'FAIL'
  const warned = status?.status === 'WARN'
  const passed = status?.status === 'PASS'
  const setField = (field: keyof WeatherObservationForm, value: string) => {
    onFormChange({ ...form, [field]: value })
  }
  const tone = failed
    ? 'danger'
    : warned
      ? 'warning'
      : passed
        ? 'success'
        : 'neutral'

  return (
    <CardComponent
      title={t.weatherTitle}
      icon={<CloudOutlined />}
      tone="amber"
      extra={
        <StatusTag tone={tone}>
          {status ? status.status : t.weatherNotChecked}
        </StatusTag>
      }
    >
      <div className="stf-stack-sm">
        {status && (
          <div style={{ fontSize: 13 }}>
            {t.weatherSummary(
              status.windSpeedMps.toFixed(1),
              status.windGustMps.toFixed(1),
              status.precipitationMmH.toFixed(1),
              status.visibilityKm.toFixed(1),
            )}
          </div>
        )}
        {error ? (
          <Alert type="error" showIcon message={error} />
        ) : (
          <div
            className="stf-muted"
            style={{ fontSize: 12.5 }}
            title={status?.advisories.join(' ') ?? undefined}
          >
            {status?.summary ?? t.weatherHint}
            {status?.advisories?.[0] ? ` ${status.advisories[0]}` : ''}
          </div>
        )}
        <div className="stf-row" style={{ justifyContent: 'space-between' }}>
          <span className="stf-muted" style={{ fontSize: 12 }}>
            {typeof latitude === 'number' && typeof longitude === 'number'
              ? t.weatherCoordinateHint(
                  latitude.toFixed(6),
                  longitude.toFixed(6),
                )
              : t.weatherNoCoordinates}
          </span>
          <Button
            onClick={onSuggest}
            disabled={suggesting}
            loading={suggesting}
          >
            {suggesting ? t.weatherSuggesting : t.weatherSuggest}
          </Button>
        </div>
        <div className="stf-form-grid">
          <WeatherField
            label={t.weatherSource}
            value={form.source}
            placeholder={t.weatherSourcePlaceholder}
            onChange={(value) => setField('source', value)}
            style={{ gridColumn: 'span 2' }}
          />
          <WeatherField
            label={t.weatherObservedAt}
            type="datetime-local"
            value={form.observedAt}
            onChange={(value) => setField('observedAt', value)}
            style={{ gridColumn: 'span 2' }}
          />
          <WeatherField
            label={t.weatherWind}
            value={form.windSpeedMps}
            placeholder="0.0"
            suffix="m/s"
            onChange={(value) => setField('windSpeedMps', value)}
          />
          <WeatherField
            label={t.weatherGust}
            value={form.windGustMps}
            placeholder="0.0"
            suffix="m/s"
            onChange={(value) => setField('windGustMps', value)}
          />
          <WeatherField
            label={t.weatherRain}
            value={form.precipitationMmH}
            placeholder="0.0"
            suffix="mm/h"
            onChange={(value) => setField('precipitationMmH', value)}
          />
          <WeatherField
            label={t.weatherVisibility}
            value={form.visibilityKm}
            placeholder="0.0"
            suffix="km"
            onChange={(value) => setField('visibilityKm', value)}
          />
          <WeatherField
            label={t.weatherTemperature}
            value={form.temperatureC}
            placeholder="0.0"
            suffix="°C"
            onChange={(value) => setField('temperatureC', value)}
          />
          <WeatherField
            label={t.weatherHumidity}
            value={form.humidityPercent}
            placeholder="0"
            suffix="%"
            onChange={(value) => setField('humidityPercent', value)}
          />
          <label className="stf-field" style={{ gridColumn: 'span 2' }}>
            <span className="stf-field-label">{t.weatherDecision}</span>
            <Select
              value={form.decision}
              onChange={(value) =>
                onFormChange({ ...form, decision: value as WeatherCheckStatus })
              }
              options={[
                { value: 'PASS', label: t.weatherDecisionPass },
                { value: 'WARN', label: t.weatherDecisionWarn },
                { value: 'FAIL', label: t.weatherDecisionFail },
              ]}
            />
          </label>
          <WeatherField
            label={t.weatherNotes}
            value={form.notes}
            placeholder={t.weatherNotesPlaceholder}
            onChange={(value) => setField('notes', value)}
            style={{ gridColumn: 'span 4' }}
          />
        </div>
      </div>
    </CardComponent>
  )
}
