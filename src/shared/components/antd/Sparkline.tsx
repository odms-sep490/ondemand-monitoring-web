import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

const STROKE = {
  blue: '#1565E8',
  green: '#16A34A',
  amber: '#F59E0B',
  violet: '#7C3AED',
  red: '#DC2626',
  cyan: '#0891B2',
} as const

/** Decorative mini area chart; the figure itself carries the accessible value. */
export function Sparkline({ values, tone }: { values: number[]; tone: keyof typeof STROKE }) {
  const id = useId().replace(/:/g, '')
  const data = values.map((v, i) => ({ i, v }))
  return (
    <div className="mgr-spark" aria-hidden="true">
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={STROKE[tone]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={STROKE[tone]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={STROKE[tone]}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
