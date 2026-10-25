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
  const bg = failed
    ? 'var(--red-bg)'
    : warned
      ? '#fff7ed'
      : passed
        ? 'var(--green-bg)'
        : 'var(--sf)'
  const border = failed
    ? 'var(--red-dot)'
    : warned
      ? '#f59e0b'
      : passed
        ? 'var(--green-dot)'
        : 'var(--bd)'
  const fg = failed
    ? 'var(--red-fg)'
    : warned
      ? '#92400e'
      : passed
        ? 'var(--green-fg)'
        : 'var(--tx)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        border: `1.5px solid ${border}`,
        background: bg,
        color: fg,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ fontSize: 14.5 }}>{t.weatherTitle}</strong>
          <span
            style={{
              height: 24,
              padding: '0 10px',
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              background: passed
                ? 'var(--green-solid)'
                : failed
                  ? 'var(--red-solid)'
                  : warned
                    ? '#f59e0b'
                    : 'var(--sf3)',
              color: passed || failed || warned ? '#fff' : 'var(--tx2)',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {status ? status.status : t.weatherNotChecked}
          </span>
          {status && (
            <span style={{ fontSize: 12, color: 'inherit' }}>
              {t.weatherSummary(
                status.windSpeedMps.toFixed(1),
                status.windGustMps.toFixed(1),
                status.precipitationMmH.toFixed(1),
                status.visibilityKm.toFixed(1),
              )}
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: error ? 'var(--red-fg)' : 'var(--tx2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={error ?? status?.advisories.join(' ') ?? undefined}
        >
          {error ?? status?.summary ?? t.weatherHint}
          {status?.advisories?.[0] ? ` ${status.advisories[0]}` : ''}
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
            {typeof latitude === 'number' && typeof longitude === 'number'
              ? t.weatherCoordinateHint(
                  latitude.toFixed(6),
                  longitude.toFixed(6),
                )
              : t.weatherNoCoordinates}
          </span>
          <button
            type="button"
            className="odm-btn"
            onClick={onSuggest}
            disabled={suggesting}
            style={{
              minWidth: 210,
              background: '#fff',
              color: 'var(--blue-dot)',
              border: '1px solid var(--blue-dot)',
            }}
          >
            {suggesting ? t.weatherSuggesting : t.weatherSuggest}
          </button>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 10,
        }}
      >
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
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            gridColumn: 'span 2',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--tx2)',
          }}
        >
          {t.weatherDecision}
          <select
            value={form.decision}
            onChange={(event) =>
              onFormChange({
                ...form,
                decision: event.target.value as WeatherCheckStatus,
              })
            }
            style={{
              height: 38,
              border: '1px solid var(--bd)',
              borderRadius: 8,
              padding: '0 10px',
              background: '#fff',
              color: 'var(--tx)',
              fontWeight: 700,
            }}
          >
            <option value="PASS">{t.weatherDecisionPass}</option>
            <option value="WARN">{t.weatherDecisionWarn}</option>
            <option value="FAIL">{t.weatherDecisionFail}</option>
          </select>
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
  )
}
