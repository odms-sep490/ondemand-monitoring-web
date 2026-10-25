import { useI18n } from '../../../../../shared/i18n'
import { droneStatusTone } from '../../../../../shared/lib/statusTone'
import type { StatusTone } from '../../../../../shared/types/domain'
import { droneStatusDonutMessages } from './DroneStatusDonut.messages'
import type { DroneStatusBreakdown } from '../../../types/dashboard'

const TONE_COLOR: Record<StatusTone, string> = {
  gray: 'var(--gray-dot)',
  yellow: 'var(--yellow-dot)',
  blue: 'var(--blue-dot)',
  green: 'var(--green-dot)',
  orange: 'var(--orange-dot)',
  red: 'var(--red-dot)',
}

/**
 * "Trạng thái đội drone" donut [TK MNG-01]. Legend shows the raw backend
 * `DroneStatus` code (matching how the design itself prints AVAILABLE /
 * ASSIGNED / IN_FLIGHT / MAINTENANCE / RETIRED as literal enum text) —
 * colours come from the app-wide `droneStatusTone` map (src/shared/lib/statusTone.ts)
 * rather than the design's one-off palette, so OUT_OF_SERVICE renders red
 * (not the design's gray for its now-removed "RETIRED" value) — see the
 * mapping table in evd/P3-manager-dashboard.md.
 */
export function DroneStatusDonut({ data }: { data: DroneStatusBreakdown[] }) {
  const { t } = useI18n(droneStatusDonutMessages)
  const total = data.reduce((sum, entry) => sum + entry.count, 0)
  const size = 120
  const stroke = 18
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  let cumulative = 0
  const arcs = data
    .filter((entry) => entry.count > 0)
    .map((entry) => {
      const fraction = entry.count / Math.max(total, 1)
      const dash = fraction * circumference
      const offset = cumulative
      cumulative += dash
      return { ...entry, dash, offset }
    })

  const summary = data
    .map((entry) => `${entry.status} ${entry.count}`)
    .join(', ')

  return (
    <div className="odm-mgr-donut">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={t.ariaLabel(total, summary)}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--sf3)"
          strokeWidth={stroke}
        />
        {arcs.map((arc) => (
          <circle
            key={arc.status}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={TONE_COLOR[droneStatusTone[arc.status]]}
            strokeWidth={stroke}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
        <text
          x={size / 2}
          y={size / 2 - 3}
          textAnchor="middle"
          fontSize={20}
          fontWeight={600}
          fill="var(--tx)"
        >
          {total}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 13}
          textAnchor="middle"
          fontSize={10}
          fill="var(--tx3)"
        >
          {t.unit}
        </text>
      </svg>
      <div className="odm-mgr-donut-legend">
        {data.map((entry) => (
          <span key={entry.status} className="odm-mgr-donut-legend-item">
            <span
              className="odm-mgr-legend-dot"
              style={{ background: TONE_COLOR[droneStatusTone[entry.status]] }}
            />
            <span className="odm-mgr-donut-legend-label">{entry.status}</span>
            <b className="odm-tn">{entry.count}</b>
          </span>
        ))}
      </div>
    </div>
  )
}
