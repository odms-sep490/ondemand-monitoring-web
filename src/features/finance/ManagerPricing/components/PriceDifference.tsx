import { formatVnd } from '../../../../shared/lib/formatVnd'

export function PriceDifference({
  system,
  proposed,
  range,
}: {
  system: number
  proposed: number
  /** Prices the Manager may approve; null when the policy limits are unknown. */
  range: { min: number; max: number } | null
}) {
  const difference = proposed - system
  const percent = system === 0 ? null : (difference / system) * 100
  const sign = difference > 0 ? '+' : ''
  const outside =
    range !== null &&
    difference !== 0 &&
    (proposed < range.min || proposed > range.max)
  return (
    <>
      <small className={difference === 0 ? '' : 'finance-price-difference'}>
        Chênh lệch: {sign}
        {formatVnd(difference)}
        {percent == null
          ? ''
          : ` (${percent > 0 ? '+' : ''}${percent.toLocaleString('vi-VN', {
              maximumFractionDigits: 4,
            })}%)`}
      </small>
      {range && (
        <small
          className={outside ? 'finance-range is-out' : 'finance-range'}
          role={outside ? 'alert' : undefined}
        >
          {outside ? 'Ngoài khoảng cho phép: ' : 'Được duyệt: '}
          {formatVnd(range.min)} – {formatVnd(range.max)}
        </small>
      )}
    </>
  )
}
