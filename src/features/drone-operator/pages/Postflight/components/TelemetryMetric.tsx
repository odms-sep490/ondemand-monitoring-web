export function TelemetryMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{ fontSize: 11, color: 'var(--tx3, #64748b)', fontWeight: 800 }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 3,
          fontSize: 17,
          color: 'var(--tx, #0f172a)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={value}
      >
        {value}
      </div>
    </div>
  )
}
