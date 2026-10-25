// ── stat card ──────────────────────────────────────────────────────────────

export type StatCardProps = {
  label: string
  value: string
  sub?: string
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div
      className="odm-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 14px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          color: 'var(--tx3)',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          className="odm-tn"
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '-.02em',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {sub && (
          <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{sub}</span>
        )}
      </div>
    </div>
  )
}
