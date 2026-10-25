import type { WeatherPreflightCheckResponse } from '../../types/missions'
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
  if (!weather) {
    return (
      <div className="odm-or-empty">Chưa có kết quả thời tiết trước bay.</div>
    )
  }
  return (
    <div className="odm-or-detail-stack">
      <div className="odm-or-result-line">
        <span
          className={`odm-or-pill odm-or-pill-${weather.safeToFly ? 'green' : 'amber'}`}
        >
          {weather.safeToFly ? 'An toàn để bay' : 'Cần chú ý'}
        </span>
        <span
          className={`odm-or-pill odm-or-pill-${checkTone(weather.status)}`}
        >
          {checkLabel(weather.status)}
        </span>
      </div>
      <dl className="odm-or-kv compact">
        <div>
          <dt>Ghi nhận lúc</dt>
          <dd>{formatDateTime(weather.checkedAt, locale)}</dd>
        </div>
        <div>
          <dt>Gió</dt>
          <dd>{formatNumber(weather.windSpeedMps, ' m/s')}</dd>
        </div>
        <div>
          <dt>Gió giật</dt>
          <dd>{formatNumber(weather.windGustMps, ' m/s')}</dd>
        </div>
        <div>
          <dt>Mưa</dt>
          <dd>{formatNumber(weather.precipitationMmH, ' mm/h')}</dd>
        </div>
        <div>
          <dt>Tầm nhìn</dt>
          <dd>{formatNumber(weather.visibilityKm, ' km')}</dd>
        </div>
        <div>
          <dt>Nhiệt độ</dt>
          <dd>{formatNumber(weather.temperatureC, ' °C')}</dd>
        </div>
        <div>
          <dt>Độ ẩm</dt>
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
