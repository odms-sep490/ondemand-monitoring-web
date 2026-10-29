import { CloudOutlined } from '@ant-design/icons'
import { Alert } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailViewMessages } from '../missionDetailView.messages'
import { statusTone } from '../missionFormat'
import type { WeatherPreflightStatus } from '../types'

export function WeatherCard({
  weather,
}: {
  weather: WeatherPreflightStatus | null
}) {
  const { t } = useI18n(missionDetailViewMessages)
  const metrics = weather
    ? [
        {
          label: t.windGust,
          value: `${weather.windSpeedMps.toFixed(1)} / ${weather.windGustMps.toFixed(1)} m/s`,
        },
        { label: t.rain, value: `${weather.precipitationMmH.toFixed(1)} mm/h` },
        { label: t.visibility, value: `${weather.visibilityKm.toFixed(1)} km` },
        {
          label: t.tempHumidity,
          value: `${weather.temperatureC.toFixed(1)}°C · ${weather.humidityPercent.toFixed(0)}%`,
        },
      ]
    : []
  return (
    <CardComponent
      title={t.weatherTitle}
      icon={<CloudOutlined />}
      tone="amber"
      extra={
        <StatusTag tone={statusTone(weather?.status)}>
          {weather
            ? weather.safeToFly
              ? t.weatherSafe
              : weather.status
            : t.weatherUnchecked}
        </StatusTag>
      }
    >
      {weather ? (
        <div className="stf-stack-sm">
          <div className="stf-muted">{weather.summary}</div>
          <div className="stf-metric-grid">
            {metrics.map((m) => (
              <div className="stf-metric" key={m.label}>
                <div className="stf-metric-label">{m.label}</div>
                <div className="stf-metric-value">{m.value}</div>
              </div>
            ))}
          </div>
          {weather.advisories.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={weather.advisories.join(' · ')}
            />
          )}
        </div>
      ) : (
        <div className="stf-muted">{t.weatherNone}</div>
      )}
    </CardComponent>
  )
}
