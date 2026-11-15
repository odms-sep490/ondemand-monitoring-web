import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { MANAGER_COLORS } from '../../../../theme/managerTheme'
import { ChartTooltip } from './ChartTooltip'

type Props = {
  points: { label: string; value: number }[]
  empty: string
  ariaLabel: string
}

export function RadarStatusChart({ points, empty, ariaLabel }: Props) {
  const data = points.filter((p) => p.value > 0)
  if (!data.length) return <p className="mgr-empty-line">{empty}</p>

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="var(--mgr-border, #e0e4ea)" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: 'var(--mgr-muted, #5b6577)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 'auto']}
            tick={{ fill: 'var(--mgr-muted, #5b6577)', fontSize: 10 }}
            tickCount={4}
          />
          <Radar
            name=""
            dataKey="value"
            stroke={MANAGER_COLORS.primary}
            fill={MANAGER_COLORS.primary}
            fillOpacity={0.18}
            strokeWidth={2}
            isAnimationActive={false}
            animationDuration={750}
            animationEasing="ease-out"
          />
          <Tooltip content={<ChartTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
