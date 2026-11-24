import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatVnd } from '../../../../../../shared/lib/formatVnd'
import { AXIS_TICK, ChartTooltip, GRID_STROKE } from './ChartTooltip'

type Props = {
  points: { date: string; received: number; refunded: number }[]
  locale: string
  days?: number
  bucket?: 'day' | 'week' | 'month'
  generatedAt?: string
  labels: { received: string; refunded: string; cumulative: string }
}

/** Interactive Recharts combo chart: cash inflows, refunds, and cumulative net receipt line. */
export function CashFlowChart({
  points,
  locale,
  labels,
  days = 30,
  bucket = 'week',
  generatedAt,
}: Props) {
  const safeNumber = (value: unknown) =>
    Number.isFinite(Number(value)) ? Number(value) : 0
  const entries = new Map(
    points.map((point) => [point.date.slice(0, 10), point]),
  )
  const latest = [...entries.keys()].sort().at(-1)
  const anchor = generatedAt
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(generatedAt))
    : latest
  const end = new Date(
    `${anchor ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`,
  )
  const sorted = Array.from({ length: days }, (_, index) => {
    const day = new Date(end)
    day.setUTCDate(day.getUTCDate() - days + index + 1)
    const key = day.toISOString().slice(0, 10)
    const point = entries.get(key)
    return {
      date: key,
      received: safeNumber(point?.received),
      refunded: safeNumber(point?.refunded),
    }
  })

  const grouped = new Map<
    string,
    { date: string; received: number; refunded: number }
  >()
  for (const point of sorted) {
    const day = new Date(`${point.date}T00:00:00Z`)
    if (bucket === 'week')
      day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7))
    if (bucket === 'month') day.setUTCDate(1)
    const key = day.toISOString().slice(0, 10)
    const current = grouped.get(key) ?? { date: key, received: 0, refunded: 0 }
    current.received += point.received
    current.refunded += point.refunded
    grouped.set(key, current)
  }

  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  })
  const compactMoney = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  })

  let balance = 0
  const rows = [...grouped.values()].map((point) => {
    balance += point.received - point.refunded
    return {
      ...point,
      label: dateFmt.format(new Date(point.date)),
      balance,
    }
  })

  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className="mgr-cash-combo"
      role="img"
      aria-label={`${labels.cumulative}: ${formatVnd(balance)}`}
    >
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={rows}
          margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            stroke={GRID_STROKE}
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v) => compactMoney.format(Number(v))}
          />
          <Tooltip
            content={
              <ChartTooltip valueFormatter={(v) => formatVnd(Number(v ?? 0))} />
            }
            cursor={{ fill: 'rgba(21, 101, 232, 0.05)' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
          />
          <Bar
            dataKey="received"
            name={labels.received}
            fill="#1565E8"
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
            isAnimationActive={!reducedMotion}
            animationDuration={650}
          />
          <Bar
            dataKey="refunded"
            name={labels.refunded}
            fill="#F59E0B"
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
            isAnimationActive={!reducedMotion}
            animationDuration={650}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name={labels.cumulative}
            stroke="#10B981"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={!reducedMotion}
            animationDuration={750}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
