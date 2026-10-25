import { useEffect, useState } from 'react'

type NumericInputProps = {
  id?: string
  label: string
  value: number | null
  onChange: (value: number | null) => void
  suffix: string
  min?: number
  step?: number
  helper?: string
  disabled?: boolean
  allowEmpty?: boolean
  ariaLabel?: string
}

const digits = (value: number | null) => (value == null ? '' : String(value))
const money = (value: number | null) =>
  value == null ? '' : Math.max(0, value).toLocaleString('vi-VN')

/** Keeps raw digits while typing and formats only after focus leaves the field. */
export function MoneyInput(props: Omit<NumericInputProps, 'suffix'>) {
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(() => money(props.value))

  useEffect(() => {
    if (!focused) setText(money(props.value))
  }, [focused, props.value])

  return (
    <PricingInputShell {...props} suffix="₫">
      <input
        id={props.id}
        type="text"
        inputMode="numeric"
        disabled={props.disabled}
        aria-label={props.ariaLabel ?? props.label}
        value={text}
        onFocus={() => {
          setFocused(true)
          setText(digits(props.value))
        }}
        onBlur={() => {
          setFocused(false)
          setText(money(props.value))
        }}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^0-9]/g, '')
          setText(raw)
          props.onChange(raw === '' ? null : Number(raw))
        }}
      />
    </PricingInputShell>
  )
}

export function UnitInput(props: NumericInputProps) {
  return (
    <PricingInputShell {...props}>
      <input
        id={props.id}
        type="number"
        min={props.min ?? 0}
        step={props.step ?? 1}
        inputMode="numeric"
        disabled={props.disabled}
        aria-label={props.ariaLabel ?? props.label}
        value={props.value ?? ''}
        onChange={(event) =>
          props.onChange(
            event.target.value === '' ? null : Number(event.target.value),
          )
        }
      />
    </PricingInputShell>
  )
}

function PricingInputShell({
  id,
  label,
  suffix,
  helper,
  children,
}: Pick<NumericInputProps, 'id' | 'label' | 'suffix' | 'helper'> & {
  children: React.ReactNode
}) {
  return (
    <label className="pricing-field" htmlFor={id}>
      <span className="pricing-field-label">{label}</span>
      <span className="pricing-input-affix">
        {children}
        <span aria-hidden="true">{suffix}</span>
      </span>
      {helper && <small>{helper}</small>}
    </label>
  )
}
