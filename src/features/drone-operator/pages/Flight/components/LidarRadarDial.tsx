import {
  getLidarSeverityStyle,
  lidarSectorLabels,
  lidarSectorPaths,
} from '../lidarHelpers'
import type {
  LidarDirectionState,
  LidarDirection,
  LidarSeverity,
} from '../inFlightTypes'

export function LidarRadarDial({
  directionStates,
  directionLabel,
  severityLabel,
}: {
  directionStates: LidarDirectionState[]
  directionLabel: Record<LidarDirection, string>
  severityLabel: Record<LidarSeverity, string>
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        padding: '4px 8px 2px',
      }}
    >
      <svg
        viewBox="-128 -118 256 236"
        width="100%"
        height="clamp(124px, 17vh, 152px)"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: 204 }}
      >
        <circle
          r="89"
          fill="color-mix(in srgb, var(--fc-bg) 36%, transparent)"
        />
        {[29, 55, 82].map((r) => (
          <circle
            key={r}
            r={r}
            fill="none"
            stroke="color-mix(in srgb, var(--fc-tx) 16%, transparent)"
            strokeWidth="1"
          />
        ))}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const a = ((deg - 90) * Math.PI) / 180
          return (
            <line
              key={deg}
              x1={Math.cos(a) * 18}
              y1={Math.sin(a) * 18}
              x2={Math.cos(a) * 88}
              y2={Math.sin(a) * 88}
              stroke="color-mix(in srgb, var(--fc-tx) 12%, transparent)"
            />
          )
        })}
        {directionStates.map((item) => {
          const style = getLidarSeverityStyle(item.severity)
          const label = lidarSectorLabels[item.direction]
          return (
            <g key={item.direction}>
              <path
                d={lidarSectorPaths[item.direction]}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={item.severity === 'UNKNOWN' ? 1 : 1.6}
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                fill="var(--fc-tx)"
                fontSize="9"
                fontWeight="950"
              >
                {directionLabel[item.direction]}
              </text>
              <text
                x={label.x}
                y={label.y + 16}
                textAnchor={label.anchor}
                fill="var(--fc-tx)"
                fontSize="12"
                fontWeight="950"
                fontFamily="var(--font-data)"
              >
                {item.display}
              </text>
              <text
                x={label.x}
                y={label.y + 31}
                textAnchor={label.anchor}
                fill={style.text}
                fontSize="8"
                fontWeight="950"
              >
                {severityLabel[item.severity]}
              </text>
            </g>
          )
        })}
        <circle
          r="20"
          fill="color-mix(in srgb, var(--fc-panel) 88%, transparent)"
          stroke="color-mix(in srgb, var(--fc-blue) 24%, var(--fc-panel))"
        />
        <circle
          r="10"
          fill="color-mix(in srgb, var(--fc-blue) 20%, transparent)"
          stroke="var(--fc-tx)"
        />
        <path
          d="M0 -18 L10 9 L0 4 L-10 9 Z"
          fill="var(--fc-blue)"
          stroke="var(--fc-tx)"
          strokeWidth="1.2"
        />
        <g opacity=".85">
          <circle cx="-14" cy="-2" r="3" fill="var(--fc-tx)" />
          <circle cx="14" cy="-2" r="3" fill="var(--fc-tx)" />
          <circle cx="-8" cy="9" r="3" fill="var(--fc-tx)" />
          <circle cx="8" cy="9" r="3" fill="var(--fc-tx)" />
          <path
            d="M-14 -2H14M-8 9H8"
            stroke="var(--fc-tx)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  )
}
