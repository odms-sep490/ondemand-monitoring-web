import { useId, useRef } from 'react'
import { digits, roundPriceToNearestThousand } from '../pricingHelpers'
import { useI18n } from '../../../../shared/i18n'
import { pricingMessages } from '../pricing.messages'

export function MoneyInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  const { t } = useI18n(pricingMessages)
  const roundingHintId = useId()
  const changed = useRef(false)
  return (
    <label>
      <span>{label} (VND)</span>
      <input
        inputMode="numeric"
        value={value}
        disabled={disabled}
        aria-label={`${label} (VND)`}
        aria-describedby={roundingHintId}
        onChange={(event) => {
          changed.current = true
          onChange(digits(event.target.value))
        }}
        onBlur={() => {
          if (!changed.current) return
          changed.current = false
          onChange(String(roundPriceToNearestThousand(Number(value))))
        }}
      />
      <small id={roundingHintId} className="finance-rounding-hint">
        {t.moneyRoundingHint}
      </small>
    </label>
  )
}
