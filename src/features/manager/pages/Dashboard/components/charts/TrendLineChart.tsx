import { Empty } from 'antd'
import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
  const uid = useId().replace(/:/g, '')
  if (!points.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />
  const data = points.map((p) => ({ ...p, label: dateLabel(p.x, locale) }))
  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`${uid}-c`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MANAGER_COLORS.primary} stopOpacity={0.4} />
              <stop offset="100%" stopColor={MANAGER_COLORS.primary} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MANAGER_COLORS.danger} stopOpacity={0.3} />
              <stop offset="100%" stopColor={MANAGER_COLORS.danger} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: MANAGER_COLORS.primary, strokeOpacity: 0.3 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 8 }} />
          <Area type="monotone" dataKey="completed" name={completedLabel} stroke={MANAGER_COLORS.primary}
            strokeWidth={2.5} fill={`url(#${uid}-c)`} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
          <Area type="monotone" dataKey="failed" name={failedLabel} stroke={MANAGER_COLORS.danger}
            strokeWidth={2} fill={`url(#${uid}-f)`} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
