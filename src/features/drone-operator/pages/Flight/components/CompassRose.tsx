export function CompassRose({
  heading,
  label,
}: {
  heading: number | null
  label: string
}) {
  const h = heading ?? 0
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10)
  return (
    <div className="fc-instrument">
      <svg viewBox="0 0 200 200" className="fc-compass" aria-hidden="true">
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="var(--fc-bg)"
          stroke="color-mix(in srgb, var(--fc-blue) 24%, var(--fc-panel))"
          strokeWidth="4"
        />
        <g
          style={{
            transform: `rotate(${-h}deg)`,
            transformOrigin: '100px 100px',
            transition: 'transform .9s linear',
          }}
        >
          {ticks.map((deg) => (
            <line
              key={deg}
              x1="100"
              x2="100"
              y1="16"
              y2={deg % 90 === 0 ? 30 : 24}
              stroke={deg % 90 === 0 ? 'var(--fc-tx)' : 'var(--fc-blue)'}
              strokeWidth={deg % 90 === 0 ? 2.5 : 1.4}
              transform={`rotate(${deg} 100 100)`}
            />
          ))}
          {(['N', 'E', 'S', 'W'] as const).map((c, i) => (
            <text
              key={c}
              x="100"
              y="46"
              textAnchor="middle"
              fontSize="15"
              fontWeight="800"
              fill={c === 'N' ? 'var(--fc-red)' : 'var(--fc-tx)'}
              transform={`rotate(${i * 90} 100 100)`}
            >
              {c}
            </text>
          ))}
        </g>
        <path d="M100 8l-7 12h14z" fill="var(--fc-blue)" />
        <text
          x="100"
          y="112"
          textAnchor="middle"
          fontSize="30"
          fontWeight="800"
          fill="var(--fc-tx)"
        >
          {heading === null ? '--' : Math.round(((h % 360) + 360) % 360)}°
        </text>
      </svg>
      <span>{label}</span>
    </div>
  )
}
