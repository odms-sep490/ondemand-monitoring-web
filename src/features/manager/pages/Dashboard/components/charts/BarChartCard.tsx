import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { MANAGER_COLORS } from '../../../../theme/managerTheme'
import { AXIS_TICK, ChartTooltip, GRID_STROKE } from './ChartTooltip'

type Props = {
  points: { label: string; value: number }[]
  empty: string
  ariaLabel: string
}

export function BarChartCard({ points, empty, ariaLabel }: Props) {
  const data = points.filter((point) => point.value > 0)
  const max = Math.max(0, ...data.map((p) => p.value))
  if (!max) return <p className="mgr-empty-line">{empty}</p>
  if (data.length === 1) {
    const point = data[0]
    return (
      <div
        className="mgr-single-chart"
        role="img"
        aria-label={`${ariaLabel}. ${point.label}: ${point.value}`}
      >
        <div className="mgr-single-chart-label">
          <span>{point.label}</span>
          <strong>{point.value}</strong>
        </div>
        <span className="mgr-single-chart-track" aria-hidden="true">
          <span style={{ width: '100%' }} />
        </span>
      </div>
    )
  }
  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={Math.max(128, data.length * 34 + 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }} barCategoryGap={10}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={124} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(21,101,232,0.06)' }} />
          <Bar dataKey="value" name="" fill={MANAGER_COLORS.primary} radius={[0, 5, 5, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
