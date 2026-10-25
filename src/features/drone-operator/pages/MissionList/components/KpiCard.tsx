export function KpiCard({
  dotColor,
  label,
  value,
  sub,
}: {
  dotColor: string
  label: string
  value: number | string
  sub?: string
}) {
  return (
    <div
      className="odm-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--tx3)',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
          }}
        />
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          className="odm-tn"
          style={{
            fontSize: typeof value === 'number' ? 26 : 18,
            fontWeight: 600,
            letterSpacing: '-.02em',
          }}
        >
          {value}
        </span>
        {sub ? (
          <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{sub}</span>
        ) : null}
      </div>
    </div>
  )
}
