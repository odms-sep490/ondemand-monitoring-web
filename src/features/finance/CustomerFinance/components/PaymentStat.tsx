import { formatVnd } from '../../../../shared/lib/formatVnd'

export function PaymentStat({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{formatVnd(value)}</strong>
    </div>
  )
}
