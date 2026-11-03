import type { ReactNode } from 'react'

export function WeatherTile({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div
      className="mds-weather-tile"
    >
      <div className="mds-weather-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="mds-weather-label">{label}</div>
      <div className="mds-weather-value">{value}</div>
    </div>
  )
}
