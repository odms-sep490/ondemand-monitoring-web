import { CHART_COLORS } from '../../dashboardTone'
import { DashboardEmptyState } from '../DashboardEmptyState'

type Props = {
  points: { label: string; value: number }[]
  empty: string
  ariaLabel: string
}

export function BarChartCard({ points, empty, ariaLabel }: Props) {
  const data = points
    .filter(
      (point) =>
        Number.isFinite(Number(point.value)) && Number(point.value) > 0,
    )
    .map((point) => ({ ...point, value: Number(point.value) }))
    .sort((a, b) => b.value - a.value)
  const total = data.reduce((sum, point) => sum + point.value, 0)
  const max = Math.max(0, ...data.map((point) => point.value))
  if (!max) {
    return <DashboardEmptyState variant="NO_DATA" title={empty} compact />
  }
  return (
    <ul className="mgr-service-bars" aria-label={ariaLabel}>
      {data.map((point, index) => {
        const color = CHART_COLORS[index % CHART_COLORS.length]
        const pct = Math.round((point.value / total) * 100)
        return (
          <li key={`${point.label}-${index}`} className="mgr-service-bar-row">
            <div className="mgr-service-bar-label">
              <span className="mgr-service-bar-name">
                <span
                  className="mgr-tooltip-dot"
                  style={{ background: color }}
                  aria-hidden="true"
                />
                {point.label}
              </span>
              <strong>
                {point.value} <small>· {pct}%</small>
              </strong>
            </div>
            <div className="mgr-service-bar-track" aria-hidden="true">
              <span
                style={{
                  width: `${(point.value / max) * 100}%`,
                  background: color,
                }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
