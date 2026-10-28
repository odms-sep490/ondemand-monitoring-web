import { formatVnd } from '../../../../shared/lib/formatVnd'
import { useI18n } from '../../../../shared/i18n'
import { pricingMessages } from '../pricing.messages'

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
  const { t, locale } = useI18n(pricingMessages)
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
        {t.differenceLabel}
        {sign}
        {formatVnd(difference)}
        {percent == null
          ? ''
          : ` (${percent > 0 ? '+' : ''}${percent.toLocaleString(locale, {
              maximumFractionDigits: 4,
            })}%)`}
      </small>
      {range && (
        <small
          className={outside ? 'finance-range is-out' : 'finance-range'}
          role={outside ? 'alert' : undefined}
        >
          {outside ? t.outsideRange : t.allowedRange}
          {formatVnd(range.min)} – {formatVnd(range.max)}
        </small>
      )}
    </>
  )
}
