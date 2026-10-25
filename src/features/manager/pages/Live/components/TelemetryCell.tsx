// ── Telemetry row ──────────────────────────────────────────────────────────

export function TelemetryCell({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="odm-live-tele-cell">
      <span className="odm-live-tele-label">{label}</span>
      <span className="odm-live-tele-value">{value}</span>
      {sub && <span className="odm-live-tele-sub">{sub}</span>}
    </div>
  )
}
