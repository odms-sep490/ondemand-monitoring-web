export function Metric({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="co-metric">
      <div className="co-metric-label">{label}</div>
      <div className="co-metric-value">{value}</div>
      {detail && <div className="co-metric-detail">{detail}</div>}
    </div>
  )
}
