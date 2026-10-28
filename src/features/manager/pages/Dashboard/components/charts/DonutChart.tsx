import { Empty } from 'antd'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { CHART_COLORS } from '../../dashboardTone'
import { ChartTooltip } from './ChartTooltip'

type Props = {
  points: { label: string; value: number }[]
  empty: string
  ariaLabel: (total: number) => string
}

export function DonutChart({ points, empty, ariaLabel }: Props) {
  const data = points.filter((p) => p.value > 0)
  const total = data.reduce((sum, p) => sum + p.value, 0)
  if (!total) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />
  return (
    <div role="img" aria-label={ariaLabel(total)}>
      <div className="mgr-donut">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={66} outerRadius={96}
              paddingAngle={3} cornerRadius={6} stroke="none">
              {data.map((p, i) => (
                <Cell key={p.label} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mgr-donut-center" aria-hidden="true">
          <strong>{total}</strong>
        </div>
      </div>
      <ul className="mgr-legend">
        {data.map((p, i) => (
          <li key={p.label}>
            <span className="mgr-tooltip-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span>{p.label}</span>
            <strong>{p.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
