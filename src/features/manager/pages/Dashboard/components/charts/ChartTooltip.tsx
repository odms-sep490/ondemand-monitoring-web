import type { TooltipContentProps } from 'recharts'

/** Card-style tooltip shared by every dashboard chart. */
type ChartTooltipProps = Partial<TooltipContentProps<number, string>> & {
  valueFormatter?: (value: unknown) => string
}

export function ChartTooltip({ active, payload, label, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="mgr-tooltip">
      {label !== undefined && label !== '' ? <div className="mgr-tooltip-title">{String(label)}</div> : null}
      {payload.map((item) => (
        <div key={String(item.dataKey ?? item.name)} className="mgr-tooltip-row">
          <span className="mgr-tooltip-dot" style={{ background: item.color ?? (item.payload as { fill?: string })?.fill }} />
          <span>{item.name}</span>
          <strong>{valueFormatter ? valueFormatter(item.value) : item.value}</strong>
        </div>
      ))}
    </div>
  )
}

export const AXIS_TICK = { fill: 'var(--mgr-muted)', fontSize: 12 } as const
export const GRID_STROKE = 'var(--mgr-border)'
