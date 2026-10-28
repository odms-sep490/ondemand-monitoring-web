import type { TooltipContentProps } from 'recharts'

/** Card-style tooltip shared by every dashboard chart. */
export function ChartTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null
  return (
    <div className="mgr-tooltip">
      {label !== undefined && label !== '' ? <div className="mgr-tooltip-title">{String(label)}</div> : null}
      {payload.map((item) => (
        <div key={String(item.dataKey ?? item.name)} className="mgr-tooltip-row">
          <span className="mgr-tooltip-dot" style={{ background: item.color ?? (item.payload as { fill?: string })?.fill }} />
          <span>{item.name}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

export const AXIS_TICK = { fill: 'var(--mgr-muted)', fontSize: 12 } as const
export const GRID_STROKE = 'var(--mgr-border)'
