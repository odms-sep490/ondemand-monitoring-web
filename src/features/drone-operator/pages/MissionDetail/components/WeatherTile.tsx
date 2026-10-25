export function WeatherTile({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) {
  return (
    <div
      className="mds-weather-tile"
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--bd)',
        background: 'var(--sf2)',
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 3 }}>
        {label}
      </div>
      <div className="mds-weather-value">{value}</div>
    </div>
  )
}
