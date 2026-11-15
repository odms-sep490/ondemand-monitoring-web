import { CHART_COLORS } from '../../dashboardTone'

type Props = { points: { label: string; value: number }[]; empty: string; ariaLabel: (total: number) => string }

export function DonutChart({ points, empty, ariaLabel }: Props) {
  const data = points.filter((point) => point.value > 0)
  const total = data.reduce((sum, point) => sum + point.value, 0)
  if (!total) return <p className="mgr-empty-line">{empty}</p>
  let offset = 0
  return (
    <div className="mgr-donut-layout" aria-label={ariaLabel(total)}>
      <div className="mgr-donut-static">
        <svg viewBox="0 0 180 180" role="img" aria-label={ariaLabel(total)}>
          <circle cx="90" cy="90" r="64" fill="none" stroke="var(--mgr-border)" strokeWidth="20" />
          {data.map((point, index) => {
            const length = point.value / total * 402.124
            const start = offset
            offset += length
            return <circle key={point.label} cx="90" cy="90" r="64" fill="none"
              stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth="20"
              strokeDasharray={`${length} ${402.124 - length}`} strokeDashoffset={-start}
              transform="rotate(-90 90 90)"><title>{point.label}: {point.value}</title></circle>
          })}
          <text x="90" y="98" textAnchor="middle" fill="var(--mgr-text)" fontSize="30" fontWeight="700">{total}</text>
        </svg>
      </div>
      <ul className="mgr-legend">{data.map((point, index) => <li key={point.label}>
        <span className="mgr-tooltip-dot" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
        <span>{point.label}</span><strong>{point.value} · {Math.round(point.value / total * 100)}%</strong>
      </li>)}</ul>
    </div>
  )
}
