import { formatVnd } from '../../../../shared/lib/formatVnd'

export function PaymentStat({
  label,
  value,
  detail,
}: {
  label: string
  value: number
  detail?: string
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{formatVnd(value)}</strong>
      {detail ? (
        <small className="customer-payment-stat-detail">{detail}</small>
      ) : null}
    </div>
  )
}
