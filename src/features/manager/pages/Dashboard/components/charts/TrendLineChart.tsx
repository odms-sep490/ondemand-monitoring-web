import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { MANAGER_COLORS } from '../../../../theme/managerTheme'
import { AXIS_TICK, ChartTooltip, GRID_STROKE } from './ChartTooltip'

export type TrendPoint = { x: string; completed: number; failed: number }

function dateLabel(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(
    new Date(`${value}T00:00:00`),
  )
}

type Props = {
  points: TrendPoint[]
  completedLabel: string
  failedLabel: string
  empty: string
  locale: string
  ariaLabel: string
}

export function TrendLineChart({ points, completedLabel, failedLabel, empty, locale, ariaLabel }: Props) {
  if (!points.length) return <p className="mgr-empty-line">{empty}</p>
  const data = points.map((p) => ({ ...p, label: dateLabel(p.x, locale) }))
  const activePoints = data.filter((point) => point.completed > 0 || point.failed > 0)
  if (!activePoints.length) return <p className="mgr-empty-line">{empty}</p>
  const chartHeight = data.length >= 14 ? 220 : data.length >= 7 ? 200 : 180
  if (activePoints.length === 1) {
    const point = activePoints[0]
    return (
      <div
        className="mgr-single-trend"
        role="img"
        aria-label={`${ariaLabel}. ${point.label}: ${completedLabel} ${point.completed}; ${failedLabel} ${point.failed}`}
      >
        <time dateTime={point.x}>{point.label}</time>
        <span>{completedLabel}<strong>{point.completed}</strong></span>
        <span>{failedLabel}<strong>{point.failed}</strong></span>
      </div>
    )
  }
  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: MANAGER_COLORS.primary, strokeOpacity: 0.3 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 8 }} />
          <Line type="linear" dataKey="completed" name={completedLabel} stroke={MANAGER_COLORS.primary}
            strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
          <Line type="linear" dataKey="failed" name={failedLabel} stroke="#64748b"
            strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
