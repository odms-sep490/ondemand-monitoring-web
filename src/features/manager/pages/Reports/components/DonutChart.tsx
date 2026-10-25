// ── donut chart ─────────────────────────────────────────────────────────────

export type DonutProps = {
  items: { label: string; count: number }[]
  total: number
  ariaLabel: string
  unit: string
}

export function DonutChart({ items, total, ariaLabel, unit }: DonutProps) {
  const R = 64
  const CIRC = 2 * Math.PI * R
  const opacities = [1, 0.78, 0.58, 0.42, 0.3, 0.2]

  let offset = 0
  const segments = items.map((item, i) => {
    const frac = total > 0 ? item.count / total : 0
    const dash = frac * CIRC
    const seg = { ...item, dash, offset, opacity: opacities[i] ?? 0.1 }
    offset += dash
    return seg
  })

  return (
    <div
      style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 6 }}
    >
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          width: 150,
          height: 150,
          flex: 'none',
        }}
      >
        <svg
          width="150"
          height="150"
          viewBox="0 0 150 150"
          style={{ transform: 'rotate(-90deg)' }}
          role="img"
          aria-label={ariaLabel}
        >
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="75"
              cy="75"
              r={R}
              fill="none"
              style={{ stroke: 'var(--ink)', opacity: seg.opacity }}
              strokeWidth="22"
              strokeDasharray={`${seg.dash} ${CIRC - seg.dash}`}
              strokeDashoffset={-seg.offset}
            />
          ))}
        </svg>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="odm-tn"
            style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}
          >
            {total}
          </span>
          <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{unit}</span>
        </span>
      </span>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
          fontSize: 12.5,
          flex: 1,
        }}
      >
        {segments.map((seg, i) => (
          <span
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: 'var(--ink)',
                opacity: opacities[i] ?? 0.1,
              }}
            />
            <span style={{ flex: 1 }}>{seg.label}</span>
            <b className="odm-tn">{seg.count}</b>
          </span>
        ))}
      </div>
    </div>
  )
}
