export function TelemetryMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="postflight-metric">
      <div className="postflight-metric-label">
        {label}
      </div>
      <div className="postflight-metric-value" title={value}>
        {value}
      </div>
    </div>
  )
}
