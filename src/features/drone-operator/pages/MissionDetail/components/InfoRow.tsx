export function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(104px, auto) minmax(0, 1fr)',
        alignItems: 'start',
        gap: 10,
        padding: '6px 0',
        fontSize: 12.5,
        borderTop: '1px solid var(--bd)',
      }}
    >
      <span
        style={{
          color: 'var(--tx3)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span style={{ fontSize: 12 }}>{icon}</span>
        {label}
      </span>
      <span
        style={{
          fontWeight: 500,
          textAlign: 'right',
          color: 'var(--tx)',
          minWidth: 0,
        }}
      >
        {value}
      </span>
    </div>
  )
}
