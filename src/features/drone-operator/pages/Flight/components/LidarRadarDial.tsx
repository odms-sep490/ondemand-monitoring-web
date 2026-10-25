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
        <circle r="89" fill="rgba(2,6,23,.36)" />
        {[29, 55, 82].map((r) => (
          <circle
            key={r}
            r={r}
            fill="none"
            stroke="rgba(203,213,225,.16)"
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
              stroke="rgba(203,213,225,.12)"
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
                fill="#e5edf8"
                fontSize="9"
                fontWeight="950"
              >
                {directionLabel[item.direction]}
              </text>
              <text
                x={label.x}
                y={label.y + 16}
                textAnchor={label.anchor}
                fill="#f8fafc"
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
        <circle r="20" fill="rgba(15,23,42,.88)" stroke="#334155" />
        <circle r="10" fill="rgba(96,165,250,.2)" stroke="#bfdbfe" />
        <path
          d="M0 -18 L10 9 L0 4 L-10 9 Z"
          fill="#60a5fa"
          stroke="#eff6ff"
          strokeWidth="1.2"
        />
        <g opacity=".85">
          <circle cx="-14" cy="-2" r="3" fill="#e2e8f0" />
          <circle cx="14" cy="-2" r="3" fill="#e2e8f0" />
          <circle cx="-8" cy="9" r="3" fill="#e2e8f0" />
          <circle cx="8" cy="9" r="3" fill="#e2e8f0" />
          <path
            d="M-14 -2H14M-8 9H8"
            stroke="#e2e8f0"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  )
}
