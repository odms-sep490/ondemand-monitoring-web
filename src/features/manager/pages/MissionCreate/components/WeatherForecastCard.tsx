import { OrderIcon } from '../../../components/common/OrderIcon'
import { suitabilityTone, weatherMetric } from '../createMissionHelpers'
import { WeatherGlyph } from './WeatherGlyph'
import { missionCreatePageMessages } from '../MissionCreatePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { OrderMissionBrief } from '../../../types/orders'
import type { ForecastRow } from '../createMissionTypes'

export function WeatherForecastCard({
  onCreated,
  forecastTime,
  weatherCheckDate,
  setWeatherCheckDate,
  weatherCheckTime,
  setWeatherCheckTime,
  brief,
  forecastRows,
}: {
  onCreated: ((missionId: string) => void) | undefined
  forecastTime: string
  weatherCheckDate: string
  setWeatherCheckDate: Dispatch<SetStateAction<string>>
  weatherCheckTime: string
  setWeatherCheckTime: Dispatch<SetStateAction<string>>
  brief: OrderMissionBrief
  forecastRows: ForecastRow[]
}) {
  const { t } = useI18n(missionCreatePageMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="info" size={18} />
          {onCreated ? t.weatherCheckTitle : t.weatherForecastTitle}
        </span>
        <span className="odm-or-pill odm-or-pill-blue">
          {t.weatherForecastTime(forecastTime)}
        </span>
      </header>
      <div className="odm-or-card-body">
        <p className="odm-or-muted odm-or-hint">
          {onCreated ? t.weatherCheckHint : t.weatherForecastHint}
        </p>
        {onCreated ? (
          <div className="odm-weather-check-controls">
            <label className="odm-or-field">
              <span className="odm-or-field-label">{t.weatherCheckDate}</span>
              <input
                className="odm-or-input"
                type="date"
                value={weatherCheckDate}
                onChange={(event) => setWeatherCheckDate(event.target.value)}
              />
            </label>
            <label className="odm-or-field">
              <span className="odm-or-field-label">{t.weatherCheckTime}</span>
              <input
                className="odm-or-input"
                type="time"
                value={weatherCheckTime}
                onChange={(event) => setWeatherCheckTime(event.target.value)}
              />
            </label>
          </div>
        ) : null}
        {!brief.center ? (
          <div className="odm-or-weather-empty">{t.weatherNoLocation}</div>
        ) : forecastRows.length === 0 ? (
          <div className="odm-or-weather-empty">{t.weatherNoDates}</div>
        ) : (
          <div className="odm-or-weather-list">
            {forecastRows.map((row) => (
              <div
                key={row.date}
                className={`odm-or-weather-row ${row.status === 'ready' ? suitabilityTone(row.forecast) : ''}`}
              >
                <div className="odm-or-weather-main">
                  <div className="odm-or-weather-top">
                    <div className="odm-or-weather-date">{row.label}</div>
                    <span
                      className="odm-or-weather-badge"
                      role={onCreated ? 'status' : undefined}
                      aria-live={onCreated ? 'polite' : undefined}
                    >
                      {row.status === 'ready'
                        ? t.weatherSuitability[
                            row.forecast.suitability ?? 'GOOD'
                          ]
                        : row.status === 'loading'
                          ? t.weatherChecking
                          : t.weatherNotReady}
                    </span>
                  </div>
                  {row.status === 'ready' ? (
                    <>
                      <div className="odm-or-weather-hero">
                        <WeatherGlyph code={row.forecast.weatherCode} />
                        <span className="odm-or-weather-label">
                          {row.forecast.weatherLabel || t.weatherUnknown}
                        </span>
                      </div>
                      <div className="odm-or-weather-metrics">
                        <div className="odm-or-weather-metric">
                          <span className="odm-or-weather-metric-label">
                            {t.weatherTemperatureLabel}
                          </span>
                          <span className="odm-or-weather-metric-value">
                            {weatherMetric(row.forecast.temperatureC, '°C')}
                          </span>
                        </div>
                        <div className="odm-or-weather-metric">
                          <span className="odm-or-weather-metric-label">
                            {t.weatherRainLabel}
                          </span>
                          <span className="odm-or-weather-metric-value">
                            {weatherMetric(
                              row.forecast.precipitationProbabilityPercent,
                              '%',
                            )}
                          </span>
                        </div>
                        <div className="odm-or-weather-metric">
                          <span className="odm-or-weather-metric-label">
                            {t.weatherWindLabel}
                          </span>
                          <span className="odm-or-weather-metric-value">
                            {weatherMetric(row.forecast.windSpeedKmh, ' km/h')}
                          </span>
                        </div>
                        <div className="odm-or-weather-metric">
                          <span className="odm-or-weather-metric-label">
                            {t.weatherHumidityLabel}
                          </span>
                          <span className="odm-or-weather-metric-value">
                            {weatherMetric(
                              row.forecast.relativeHumidityPercent,
                              '%',
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="odm-or-weather-desc">
                      {row.status === 'loading'
                        ? t.weatherLoading
                        : row.status === 'unavailable'
                          ? t.weatherUnavailable
                          : t.weatherError}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
