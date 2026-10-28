import type { WeatherPreflightCheckResponse } from '../../types/missions'
import { useI18n } from '../../../../shared/i18n'
import { detailPanelsMessages } from './detailPanels.messages'
import {
  checkTone,
  checkLabel,
  formatDateTime,
  formatNumber,
} from './missionDetailHelpers'

export function WeatherResultDetail({
  weather,
  locale,
}: {
  weather: WeatherPreflightCheckResponse | null
  locale: 'vi-VN' | 'en-US'
}) {
  const { t } = useI18n(detailPanelsMessages)
  if (!weather) {
    return (
      <div className="odm-or-empty">{t.noWeather}</div>
    )
  }
  return (
    <div className="odm-or-detail-stack">
      <div className="odm-or-result-line">
        <span
          className={`odm-or-pill odm-or-pill-${weather.safeToFly ? 'green' : 'amber'}`}
        >
          {weather.safeToFly ? t.safeToFly : t.caution}
        </span>
        <span
          className={`odm-or-pill odm-or-pill-${checkTone(weather.status)}`}
        >
          {checkLabel(weather.status)}
        </span>
      </div>
      <dl className="odm-or-kv compact">
        <div>
          <dt>{t.recordedAt}</dt>
          <dd>{formatDateTime(weather.checkedAt, locale)}</dd>
        </div>
        <div>
          <dt>{t.wind}</dt>
          <dd>{formatNumber(weather.windSpeedMps, ' m/s')}</dd>
        </div>
        <div>
          <dt>{t.windGust}</dt>
          <dd>{formatNumber(weather.windGustMps, ' m/s')}</dd>
        </div>
        <div>
          <dt>{t.rain}</dt>
          <dd>{formatNumber(weather.precipitationMmH, ' mm/h')}</dd>
        </div>
        <div>
          <dt>{t.visibility}</dt>
          <dd>{formatNumber(weather.visibilityKm, ' km')}</dd>
        </div>
        <div>
          <dt>{t.temperature}</dt>
          <dd>{formatNumber(weather.temperatureC, ' °C')}</dd>
        </div>
        <div>
          <dt>{t.humidity}</dt>
          <dd>{formatNumber(weather.humidityPercent, '%')}</dd>
        </div>
      </dl>
      <p className="odm-or-detail-note">{weather.summary}</p>
      {weather.advisories?.length ? (
        <ul className="odm-or-weather-advisories">
          {weather.advisories.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
