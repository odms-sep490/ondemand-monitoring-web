import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { AXIS_TICK, ChartTooltip, GRID_STROKE } from './ChartTooltip'

type DataKey = { key: string; label: string; color: string }

type Props = {
  data: Record<string, string | number>[]
  dataKeys: DataKey[]
  xKey?: string
  empty: string
  ariaLabel: string
  height?: number
  yTickFormatter?: (value: number) => string
  valueFormatter?: (value: unknown) => string
}

export function StackedBarChart({
  data,
  dataKeys,
  xKey = 'label',
  empty,
  ariaLabel,
  height = 220,
  yTickFormatter,
  valueFormatter,
}: Props) {
  if (!data.length) return <p className="mgr-empty-line">{empty}</p>

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} stackOffset="sign" margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={16} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={yTickFormatter} />
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: 'rgba(21,101,232,0.06)' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 8 }} />
          {dataKeys.map((dk) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.label}
              stackId="a"
              fill={dk.color}
              maxBarSize={32}
              radius={data.some((row) => Number(row[dk.key]) < 0) ? [0, 0, 4, 4] : [4, 4, 0, 0]}
              isAnimationActive={false}
              animationDuration={750}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
