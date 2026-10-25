export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13.5,
      }}
    >
      <span style={{ color: 'var(--tx3, #64748b)', fontWeight: 500 }}>
        {label}:
      </span>
      <span style={{ fontWeight: 700, color: 'var(--tx, #0f172a)' }}>
        {value}
      </span>
    </div>
  )
}
