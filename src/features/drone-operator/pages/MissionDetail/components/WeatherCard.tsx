import type { WeatherPreflightStatus } from '../types'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { statusTone } from '../missionFormat'
import { WeatherTile } from './WeatherTile'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import {
  isWeatherCheckFresh,
  isWeatherCheckFreshAfterPermit,
} from '../weatherReadiness'
import {
  CloudOutlined,
  CloudDownloadOutlined,
  DashboardOutlined,
  EyeOutlined,
} from '@ant-design/icons'

// ─── Weather card ─────────────────────────────────────────────────────────────

export function WeatherCard({
  weather,
  weatherNotBefore,
  loading = false,
  reviewMode = false,
  canCheckWeather = false,
  checkingWeather = false,
  onCheckWeather,
  canCancelMission = false,
  onCancelMission,
  canApproveWeather = false,
  approvingWeather = false,
  onApproveWeather,
}: {
  weather: WeatherPreflightStatus | null
  weatherNotBefore?: string | null
  loading?: boolean
  reviewMode?: boolean
  canCheckWeather?: boolean
  checkingWeather?: boolean
  onCheckWeather?: () => void
  canCancelMission?: boolean
  onCancelMission?: () => void
  canApproveWeather?: boolean
  approvingWeather?: boolean
  onApproveWeather?: () => void
}) {
  const { t } = useI18n(missionDetailPageMessages)
  const weatherIsFresh = isWeatherCheckFreshAfterPermit(
    weather,
    weatherNotBefore,
  )
  const weatherNeedsRefresh = reviewMode && !weatherIsFresh
  const weatherNeedsPostPermitCheck =
    Boolean(weather && weatherNotBefore) &&
    isWeatherCheckFresh(weather) &&
    Date.parse(weather!.checkedAt) <= Date.parse(weatherNotBefore!)
  const weatherIsAccepted = weather?.inspectorAccepted === true
  const canAccept =
    canApproveWeather &&
    weatherIsFresh &&
    !weatherIsAccepted
  const canCheck =
    canCheckWeather &&
    (!weatherIsFresh || weather?.safeToFly !== true)
  const canCancel = canCancelMission && !weatherIsAccepted

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <div>
          <h2 className="mds-card-heading">
            {reviewMode ? t.weatherReviewTitle : t.weatherCardTitle}
          </h2>
        </div>
        <StatusBadge
          tone={
            loading && !weather
              ? 'gray'
              : !weather
                ? statusTone(undefined)
              : weatherNeedsRefresh
                  ? 'yellow'
                  : weather.safeToFly
                    ? weatherIsAccepted
                      ? 'green'
                      : 'yellow'
                    : 'red'
          }
        >
          {loading && !weather
            ? t.weatherLoading
            : weather
              ? weatherNeedsRefresh
                ? t.weatherNeedsRefresh
                : weather.safeToFly
                  ? weatherIsAccepted
                    ? t.weatherAccepted
                    : canApproveWeather
                      ? t.weatherAwaitingInspector
                      : t.weatherSafe
                  : t.weatherNotSafe
              : t.weatherNotChecked}
        </StatusBadge>
      </div>
      <div className="odm-card-body mds-weather-body">
        {loading && !weather ? (
          <div aria-live="polite" role="status" aria-label={t.weatherLoading}>
            <div className="mds-weather-grid" aria-hidden="true">
              <WeatherTile
                label={t.windLabel}
                value="— / — m/s"
                icon={<CloudOutlined />}
              />
              <WeatherTile
                label={t.rainLabel}
                value="— mm/h"
                icon={<CloudDownloadOutlined />}
              />
              <WeatherTile
                label={t.visibilityLabel}
                value="— km"
                icon={<EyeOutlined />}
              />
              <WeatherTile
                label={t.temperatureHumidityLabel}
                value="—°C · —%"
                icon={<DashboardOutlined />}
              />
            </div>
          </div>
        ) : weather ? (
          <>
            <div className="mds-weather-checked-at">
              Đã kiểm tra {new Date(weather.checkedAt).toLocaleString('vi-VN', {
                day: 'numeric',
                month: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="mds-weather-grid">
              <WeatherTile
                label={t.windLabel}
                value={`${weather.windSpeedMps.toFixed(1)} / ${weather.windGustMps.toFixed(1)} m/s`}
                icon={<CloudOutlined />}
              />
              <WeatherTile
                label={t.rainLabel}
                value={`${weather.precipitationMmH.toFixed(1)} mm/h`}
                icon={<CloudDownloadOutlined />}
              />
              <WeatherTile
                label={t.visibilityLabel}
                value={`${weather.visibilityKm.toFixed(1)} km`}
                icon={<EyeOutlined />}
              />
              <WeatherTile
                label={t.temperatureHumidityLabel}
                value={`${weather.temperatureC.toFixed(1)}°C · ${weather.humidityPercent.toFixed(0)}%`}
                icon={<DashboardOutlined />}
              />
            </div>
            {!weather.safeToFly && !weatherNeedsRefresh && weather.summary && (
              <div className="mds-weather-summary" role="status">
                {weather.summary}
              </div>
            )}
            {!weather.safeToFly && !weatherNeedsRefresh && weather.advisories.length > 0 && (
              <div
                className="mds-weather-summary is-warning"
              >
                {weather.advisories.join(' · ')}
              </div>
            )}
            {weatherIsAccepted && !weather.safeToFly ? (
              <div className="mds-weather-summary" role="status">
                {t.weatherDecisionAccepted}
              </div>
            ) : null}
            {weatherNeedsRefresh ? (
              <div className="mds-weather-feedback is-warning" role="status">
                {weatherNeedsPostPermitCheck
                  ? t.weatherAfterPermitRequired
                  : t.weatherExpired}
              </div>
            ) : null}
          </>
        ) : (
          <div>
            <div className="mds-weather-empty-copy">
              {t.weatherNotCheckedHint}
            </div>
            <div className="mds-weather-grid" aria-hidden="true">
              <WeatherTile
                label={t.windLabel}
                value="— / — m/s"
                icon={<CloudOutlined />}
              />
              <WeatherTile
                label={t.rainLabel}
                value="— mm/h"
                icon={<CloudDownloadOutlined />}
              />
              <WeatherTile
                label={t.visibilityLabel}
                value="— km"
                icon={<EyeOutlined />}
              />
              <WeatherTile
                label={t.temperatureHumidityLabel}
                value="—°C · —%"
                icon={<DashboardOutlined />}
              />
            </div>
          </div>
        )}
        {(canCheck || canAccept || canCancel) && (
          <div className="mds-weather-approval-row">
            {canCancel && (
              <button
                type="button"
                className="odm-btn odm-btn-danger-soft mds-weather-cancel"
                onClick={onCancelMission}
              >
                {t.cancelMission}
              </button>
            )}
            {canCheck && (
              <button
                type="button"
                className="odm-btn odm-btn-p mds-weather-approve"
                disabled={checkingWeather || loading}
                onClick={onCheckWeather}
              >
                {checkingWeather || loading
                  ? t.weatherLoading
                  : weather
                    ? t.refreshWeather
                    : t.checkWeather}
              </button>
            )}
            {canAccept && (
              <button
                type="button"
                className="odm-btn odm-btn-ok mds-weather-approve"
                disabled={approvingWeather}
                onClick={onApproveWeather}
              >
                {approvingWeather ? t.acceptingWeather : t.acceptWeather}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
