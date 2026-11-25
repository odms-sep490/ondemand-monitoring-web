export function MetricTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number | null | undefined
  tone?: 'positive' | 'danger' | 'muted'
}) {
  return (
    <div className={`odm-or-detail-metric${tone ? ` is-${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
    </div>
  )
}
