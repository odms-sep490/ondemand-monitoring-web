import { useI18n } from '../../../../../shared/i18n'
import { missionStatusChartMessages } from './MissionStatusChart.messages'
import type { MissionStatusDayPoint } from '../../../types/dashboard'

type SeriesKey = 'completed' | 'inFlight' | 'failed' | 'cancelled'

// Bottom-to-top stack order + legend order, matching [TK MNG-01]
// ("COMPLETED, IN_FLIGHT, FAILED, CANCELLED").
const SERIES: Array<{ key: SeriesKey; label: string; color: string }> = [
  { key: 'completed', label: 'COMPLETED', color: 'var(--green-dot)' },
  { key: 'inFlight', label: 'IN_FLIGHT', color: 'var(--blue-dot)' },
  { key: 'failed', label: 'FAILED', color: 'var(--red-dot)' },
  { key: 'cancelled', label: 'CANCELLED', color: 'var(--gray-dot)' },
]

function dayTotal(day: MissionStatusDayPoint): number {
  return day.completed + day.inFlight + day.failed + day.cancelled
}

function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

/**
 * "Mission theo trạng thái · 7 ngày gần nhất" stacked bar chart [TK MNG-01].
 * Accessible per AGENT-RULES.md rule 8: `role="img"` + summary `aria-label`,
 * plus a visually-hidden table with the exact per-day values for screen
 * readers / anything that can't parse the SVG.
 */
export function MissionStatusChart({
  days,
}: {
  days: MissionStatusDayPoint[]
}) {
  const { t } = useI18n(missionStatusChartMessages)
  const hasData = days.length > 0 && days.some((day) => dayTotal(day) > 0)

  if (!hasData) {
    return <div className="odm-mgr-chart-empty">{t.empty}</div>
  }

  const width = 700
  const height = 220
  const marginLeft = 28
  const marginRight = 10
  const marginTop = 10
  const marginBottom = 24
  const plotWidth = width - marginLeft - marginRight
  const plotHeight = height - marginTop - marginBottom
  const maxTotal = Math.max(1, ...days.map(dayTotal))
  const barGap = 16
  const barWidth = (plotWidth - barGap * (days.length - 1)) / days.length

  const bars = days.map((day, index) => {
    const x = marginLeft + index * (barWidth + barGap)
    let cursorY = marginTop + plotHeight
    const segments = SERIES.map((series) => {
      const value = day[series.key]
      const segHeight = (value / maxTotal) * plotHeight
      const y = cursorY - segHeight
      cursorY = y
      return { ...series, value, y, height: segHeight }
    }).filter((segment) => segment.value > 0)
    return { day, x, segments }
  })

  const summary = days
    .map((day) => `${formatDayLabel(day.date)}: ${dayTotal(day)} mission`)
    .join(', ')

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t.ariaLabel(summary)}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {bars.map(({ day, x, segments }) => (
          <g key={day.date}>
            {segments.map((segment) => (
              <rect
                key={segment.key}
                x={x}
                y={segment.y}
                width={barWidth}
                height={segment.height}
                rx={2}
                fill={segment.color}
              />
            ))}
            <text
              x={x + barWidth / 2}
              y={height - 6}
              textAnchor="middle"
              fontSize={10.5}
              fill="var(--tx3)"
            >
              {formatDayLabel(day.date)}
            </text>
          </g>
        ))}
      </svg>
      <div className="odm-mgr-chart-legend">
        {SERIES.map((series) => (
          <span key={series.key} className="odm-mgr-chip-legend">
            <span
              className="odm-mgr-legend-dot"
              style={{ background: series.color }}
            />
            {series.label}
          </span>
        ))}
      </div>
      <table className="odm-visually-hidden">
        <caption>{t.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{t.day}</th>
            {SERIES.map((series) => (
              <th scope="col" key={series.key}>
                {series.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <th scope="row">{formatDayLabel(day.date)}</th>
              <td>{day.completed}</td>
              <td>{day.inFlight}</td>
              <td>{day.failed}</td>
              <td>{day.cancelled}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
