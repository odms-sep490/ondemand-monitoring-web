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

import { DashboardEmptyState } from '../DashboardEmptyState'
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
  if (!data.length) {
    return <DashboardEmptyState variant="NO_DATA" title={empty} compact />
  }

  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          stackOffset="sign"
          margin={{ top: 10, right: 10, left: -14, bottom: 2 }}
        >
          <CartesianGrid
            stroke={GRID_STROKE}
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            tickFormatter={yTickFormatter}
          />
          <Tooltip
            content={<ChartTooltip valueFormatter={valueFormatter} />}
            cursor={{ fill: 'rgba(21,101,232,0.06)', radius: 6 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
          />
          {dataKeys.map((dk, index) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.label}
              stackId="a"
              fill={dk.color}
              maxBarSize={30}
              radius={
                data.some((row) => Number(row[dk.key]) < 0)
                  ? [0, 0, 5, 5]
                  : index === dataKeys.length - 1
                    ? [5, 5, 0, 0]
                    : [0, 0, 0, 0]
              }
              isAnimationActive={!reducedMotion}
              animationDuration={650}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
