// ── chart helpers ───────────────────────────────────────────────────────────

export type LineChartProps = {
  data: { label: string; value: number }[]
  width: number
  height: number
  minVal?: number
  maxVal?: number
  color?: string
  yLabels?: string[]
  yValues?: number[]
  bottomPadding?: number
  ariaLabel?: string
}

/** Pure-SVG line chart — no external library. */
export function LineChart({
  data,
  width,
  height,
  minVal,
  maxVal,
  color = 'var(--green-dot)',
  yLabels,
  yValues,
  bottomPadding = 16,
  ariaLabel,
}: LineChartProps) {
  const LEFT = 30
  const RIGHT = width - 8
  const TOP = 8
  const BOTTOM = height - bottomPadding

  const vals = data.map((d) => d.value)
  const lo = minVal ?? Math.min(...vals)
  const hi = maxVal ?? Math.max(...vals)
  const range = hi - lo || 1

  function px(v: number) {
    return BOTTOM - ((v - lo) / range) * (BOTTOM - TOP)
  }

  const points = data.map((d, i) => {
    const x = LEFT + (i / (data.length - 1)) * (RIGHT - LEFT)
    const y = px(d.value)
    return { x, y, label: d.label, value: d.value }
  })

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Y grid lines */}
      {(yValues ?? [hi]).map((yv, i) => {
        const y = px(yv)
        return (
          <g key={i}>
            <line
              x1={LEFT}
              x2={RIGHT}
              y1={y}
              y2={y}
              style={{ stroke: 'var(--bd)' }}
            />
            {yLabels && (
              <text
                x={LEFT - 6}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fontFamily="IBM Plex Sans,sans-serif"
                style={{ fill: 'var(--tx3)' }}
              >
                {yLabels[i]}
              </text>
            )}
          </g>
        )
      })}
      <polyline
        points={polyline}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ stroke: color }}
        strokeWidth="2.2"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r="2.8"
            style={{ fill: 'var(--sf)', stroke: color }}
            strokeWidth="1.8"
          />
          <text
            x={p.x}
            y={height - 2}
            textAnchor="middle"
            fontSize="10.5"
            fontFamily="IBM Plex Sans,sans-serif"
            style={{ fill: 'var(--tx3)' }}
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
