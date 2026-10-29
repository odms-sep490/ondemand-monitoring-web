import { Input } from 'antd'
import { useEffect, useState, type ReactNode } from 'react'

import { useLanguage } from '../../../../../shared/i18n'

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

const money = (value: number | null, locale: string) =>
  value == null ? '' : Math.max(0, value).toLocaleString(locale)
const digits = (value: number | null) => (value == null ? '' : String(value))

/** Keeps raw digits while typing and formats only after focus leaves the field. */
export function MoneyInput(props: Omit<NumericInputProps, 'suffix'>) {
  const { locale } = useLanguage()
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(() => money(props.value, locale))

  useEffect(() => {
    if (!focused) setText(money(props.value, locale))
  }, [focused, props.value, locale])

  return (
    <PricingInputShell {...props} suffix="₫">
      <Input
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
          setText(money(props.value, locale))
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
      <Input
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
  children: ReactNode
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
