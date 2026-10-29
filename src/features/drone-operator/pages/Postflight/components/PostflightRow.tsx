export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="stf-row"
      style={{ justifyContent: 'space-between', fontSize: 13.5 }}
    >
      <span className="stf-muted">{label}:</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  )
}
