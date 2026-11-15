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
  if (!max) return <p className="mgr-empty-line">{empty}</p>
  return (
    <ul className="mgr-service-bars" aria-label={ariaLabel}>
      {data.map((point, index) => (
        <li key={`${point.label}-${index}`}>
          <div className="mgr-service-bar-label">
            <span>{point.label}</span>
            <strong>
              {point.value}{' '}
              <small>· {Math.round((point.value / total) * 100)}%</small>
            </strong>
          </div>
          <div className="mgr-service-bar-track" aria-hidden="true">
            <span style={{ width: `${(point.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
