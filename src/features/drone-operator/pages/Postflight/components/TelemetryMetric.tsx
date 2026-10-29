export function TelemetryMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="stf-metric">
      <div className="stf-metric-label">{label}</div>
      <div className="stf-metric-value" title={value}>
        {value}
      </div>
    </div>
  )
}
