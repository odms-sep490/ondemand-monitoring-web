import { CheckGlyph, checkTone } from '../../../components/common/CheckGlyph'
import { StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailViewMessages } from '../missionDetailView.messages'
import type { WeatherPreflightStatus } from '../types'

export function PrecheckWeatherResult({
  weather,
}: {
  weather: WeatherPreflightStatus | null
}) {
  const { t } = useI18n(missionDetailViewMessages)
  const status = weather
    ? weather.safeToFly
      ? t.weatherPass
      : weather.status === 'WARN'
        ? t.weatherWarn
        : t.weatherFail
    : t.weatherUnchecked
  const tone = !weather
    ? 'neutral'
    : weather.status === 'FAIL'
      ? 'danger'
      : weather.status === 'WARN'
        ? 'warning'
        : 'success'
  return (
    <div className="stf-checklist" style={{ marginBottom: 12 }}>
      <div className="stf-check">
        <CheckGlyph tone={weather ? checkTone(weather.status) : 'neutral'} />
        <div style={{ minWidth: 0 }}>
          <div className="stf-check-name">{t.weatherResult}</div>
          <div className="stf-check-msg" title={weather?.summary}>
            {weather
              ? t.weatherSummary(
                  weather.summary,
                  weather.windSpeedMps.toFixed(1),
                  weather.visibilityKm.toFixed(1),
                )
              : t.weatherNone}
          </div>
        </div>
        <StatusTag tone={tone}>{status}</StatusTag>
      </div>
    </div>
  )
}
