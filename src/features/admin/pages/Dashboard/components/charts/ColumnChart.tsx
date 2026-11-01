import { Empty } from 'antd'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  AXIS_TICK,
  ChartTooltip,
  GRID_STROKE,
} from '../../../../../manager/pages/Dashboard/components/charts/ChartTooltip'

type Props = {
  points: { label: string; value: number }[]
  name: string
  empty: string
  ariaLabel: string
}

/** Vertical column chart in the same visual language as the manager charts. */
export function ColumnChart({ points, name, empty, ariaLabel }: Props) {
  if (!points.some((p) => p.value > 0))
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />
  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={points} margin={{ top: 8, right: 8, left: -16 }}>
          <CartesianGrid
            stroke={GRID_STROKE}
            strokeDasharray="4 6"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'rgba(21,101,232,0.06)' }}
          />
          <Bar
            dataKey="value"
            name={name}
            radius={[8, 8, 0, 0]}
            maxBarSize={36}
          >
            {points.map((p, i) => (
              <Cell
                key={p.label}
                fill={i === points.length - 1 ? '#7C3AED' : '#1565E8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
