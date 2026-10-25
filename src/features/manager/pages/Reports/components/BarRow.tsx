// ── bar chart helper ────────────────────────────────────────────────────────

export type BarRowProps = {
  label: string
  value: number
  maxValue: number
  color?: string
  unit?: string
}

export function BarRow({
  label,
  value,
  maxValue,
  color = 'var(--blue-dot)',
  unit = '%',
}: BarRowProps) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44% 1fr 46px',
        gap: 10,
        alignItems: 'center',
        fontSize: 12.5,
      }}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div
        style={{
          height: 10,
          borderRadius: 5,
          background: 'var(--sf3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 5,
          }}
        />
      </div>
      <span className="odm-tn" style={{ textAlign: 'right', fontWeight: 600 }}>
        {value}
        {unit}
      </span>
    </div>
  )
}
