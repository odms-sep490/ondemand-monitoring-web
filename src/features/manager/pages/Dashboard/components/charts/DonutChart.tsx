import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { statusChartColor } from '../../dashboardTone'
import { DashboardEmptyState } from '../DashboardEmptyState'
import { ChartTooltip } from './ChartTooltip'

export type DonutPoint = {
  key?: string
  label: string
  value: number
  color?: string
}

type Props = {
  points: DonutPoint[]
  empty: string
  ariaLabel: (total: number) => string
  centerCaption?: string
  onSelect?: (point: DonutPoint) => void
}

export function DonutChart({
  points,
  empty,
  ariaLabel,
  centerCaption,
  onSelect,
}: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const data = points
    .filter((point) => point.value > 0)
    .map((point, index) => ({
      ...point,
      fill: point.color ?? statusChartColor(point.key, index),
    }))
  const total = data.reduce((sum, point) => sum + point.value, 0)

  if (!total) {
    return <DashboardEmptyState variant="NO_DATA" title={empty} compact />
  }

  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const activePoint = activeIndex !== null ? data[activeIndex] : null
  const centerValue = activePoint ? activePoint.value : total
  const centerSub = activePoint
    ? `${Math.round((activePoint.value / total) * 100)}%`
    : (centerCaption ?? '')

  return (
    <div className="mgr-donut-layout" aria-label={ariaLabel(total)}>
      <div className="mgr-donut-stage" role="img" aria-label={ariaLabel(total)}>
        <ResponsiveContainer width="100%" height={196}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={data.length > 1 ? 3 : 0}
              cornerRadius={6}
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={!reducedMotion}
              animationDuration={680}
              animationEasing="ease-out"
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={(_, idx) => {
                if (onSelect && data[idx]) onSelect(data[idx])
              }}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.key ?? entry.label}
                  fill={entry.fill}
                  fillOpacity={
                    activeIndex === null || activeIndex === idx ? 1 : 0.35
                  }
                  style={{
                    cursor: onSelect ? 'pointer' : 'default',
                    transition: 'fill-opacity 180ms ease',
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={(val) => {
                    const num = Number(val ?? 0)
                    return `${num} (${Math.round((num / total) * 100)}%)`
                  }}
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mgr-donut-center" aria-hidden="true">
          <strong className="mgr-donut-center-value">{centerValue}</strong>
          {centerSub ? (
            <span className="mgr-donut-center-sub">{centerSub}</span>
          ) : null}
        </div>
      </div>

      <ul className="mgr-legend">
        {data.map((point, index) => {
          const pct = Math.round((point.value / total) * 100)
          const isHighlighted = activeIndex === index
          return (
            <li
              key={point.key ?? point.label}
              className={`mgr-legend-item${isHighlighted ? ' is-highlighted' : ''}${onSelect ? ' is-clickable' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => onSelect?.(point)}
            >
              <span
                className="mgr-tooltip-dot"
                style={{ background: point.fill }}
                aria-hidden="true"
              />
              <span className="mgr-legend-label">{point.label}</span>
              <strong className="mgr-legend-metric">
                {point.value} <span className="mgr-legend-pct">({pct}%)</span>
              </strong>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
