import { formatVnd } from '../../../../shared/lib/formatVnd'

export function SummaryRow({
  label,
  value,
  total = false,
  signed = false,
  tone,
}: {
  label: string
  value: number
  total?: boolean
  signed?: boolean
  tone?: 'up' | 'down'
}) {
  return (
    <div className={total ? 'is-total' : ''}>
      <dt>{label}</dt>
      <dd className={tone ? `is-${tone}` : undefined}>
        {signed && value > 0 ? '+' : ''}
        {formatVnd(value)}
      </dd>
    </div>
  )
}
