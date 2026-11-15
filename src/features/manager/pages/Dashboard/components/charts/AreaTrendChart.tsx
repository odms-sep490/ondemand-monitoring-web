import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { MANAGER_COLORS } from '../../../../theme/managerTheme'
import { AXIS_TICK, ChartTooltip, GRID_STROKE } from './ChartTooltip'

export type AreaTrendPoint = { x: string; completed: number; failed: number }

function dateLabel(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(
    new Date(`${value}T00:00:00`),
  )
}

type Props = {
  points: AreaTrendPoint[]
  completedLabel: string
  failedLabel: string
  empty: string
  locale: string
  ariaLabel: string
}

export function AreaTrendChart({
  points,
  completedLabel,
  failedLabel,
  empty,
  locale,
  ariaLabel,
}: Props) {
  const chartId = useId().replace(/:/g, '')
  if (!points.length) return <p className="mgr-empty-line">{empty}</p>
  const data = points.map((p) => ({ ...p, label: dateLabel(p.x, locale) }))
  const activePoints = data.filter((p) => p.completed > 0 || p.failed > 0)
  if (!activePoints.length) return <p className="mgr-empty-line">{empty}</p>

  if (data.length === 1) {
    return <div className="mgr-trend-single"><strong>{data[0].label}</strong><dl><div><dt>{completedLabel}</dt><dd>{data[0].completed}</dd></div><div><dt>{failedLabel}</dt><dd>{data[0].failed}</dd></div></dl></div>
  }

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`colorCompleted-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={MANAGER_COLORS.primary} stopOpacity={0.25} />
              <stop offset="95%" stopColor={MANAGER_COLORS.primary} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`colorFailed-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: MANAGER_COLORS.primary, strokeOpacity: 0.25 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 8 }} />
          <Area
            type="monotone"
            dataKey="completed"
            name={completedLabel}
            stroke={MANAGER_COLORS.primary}
            strokeWidth={2}
            fill={`url(#colorCompleted-${chartId})`}
            dot={{ r: 2 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            isAnimationActive={false}
            animationDuration={750}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="failed"
            name={failedLabel}
            stroke="#64748b"
            strokeWidth={2}
            fill={`url(#colorFailed-${chartId})`}
            dot={{ r: 2 }}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
            isAnimationActive={false}
            animationDuration={750}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
