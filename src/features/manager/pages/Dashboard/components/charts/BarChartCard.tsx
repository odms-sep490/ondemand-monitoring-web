import { Empty } from 'antd'
import { useId } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { CHART_GRADIENTS } from '../../dashboardTone'
import { AXIS_TICK, ChartTooltip, GRID_STROKE } from './ChartTooltip'

type Props = {
  points: { label: string; value: number }[]
  empty: string
  ariaLabel: string
}

export function BarChartCard({ points, empty, ariaLabel }: Props) {
  const uid = useId().replace(/:/g, '')
  const max = Math.max(0, ...points.map((p) => p.value))
  if (!max) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />
  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={Math.max(200, points.length * 56 + 40)}>
        <BarChart data={points} layout="vertical" margin={{ left: 0, right: 16 }} barCategoryGap={14}>
          <defs>
            {CHART_GRADIENTS.map(([from, to], i) => (
              <linearGradient key={from} id={`${uid}-${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={from} />
                <stop offset="100%" stopColor={to} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={132} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(21,101,232,0.06)' }} />
          <Bar dataKey="value" name="" radius={[0, 10, 10, 0]} barSize={20}>
            {points.map((p, i) => (
              <Cell key={p.label} fill={`url(#${uid}-${i % CHART_GRADIENTS.length})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
