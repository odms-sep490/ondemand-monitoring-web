export function MetricTile({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  return (
    <div className="odm-or-detail-metric">
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
    </div>
  )
}
