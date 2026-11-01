import { InputNumber } from 'antd'
import { useId, type ReactNode } from 'react'

import { useLanguage } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'

type NumericInputProps = {
  id?: string
  label: string
  value: number | null
  onChange: (value: number | null) => void
  suffix: string
  min?: number
  max?: number
  step?: number
  helper?: string
  disabled?: boolean
  ariaLabel?: string
}

/** The currency sign formatVnd uses (kept in one place so it is never typed by hand). */
const VND_SIGN = formatVnd(0).replace(/[0-9\s.,]/g, '')

/** Digits only, so a pasted "1.200.000 ₫" still reads as 1200000. */
const parseDigits = (text: string | undefined) =>
  (text ?? '').replace(/[^0-9]/g, '')

/** Money field (whole VND): grouped with the UI locale for reading, plain digits are accepted while typing. */
export function MoneyInput(props: Omit<NumericInputProps, 'suffix'>) {
  const { locale } = useLanguage()
  const fieldId = useId()
  const id = props.id ?? fieldId
  return (
    <PricingInputShell {...props} id={id} suffix={VND_SIGN}>
      <InputNumber<number>
        id={id}
        className="adm-input-full"
        min={0}
        precision={0}
        disabled={props.disabled}
        aria-label={props.ariaLabel}
        value={props.value}
        formatter={(value) =>
          value === undefined || value === null
            ? ''
            : Number(value).toLocaleString(locale)
        }
        parser={(text) => {
          const digits = parseDigits(text)
          return digits === '' ? (null as unknown as number) : Number(digits)
        }}
        onChange={(value) => props.onChange(value ?? null)}
      />
    </PricingInputShell>
  )
}

/** Plain number field with a unit suffix (ha, km, %, images...). */
export function UnitInput(props: NumericInputProps) {
  const fieldId = useId()
  const id = props.id ?? fieldId
  return (
    <PricingInputShell {...props} id={id}>
      <InputNumber<number>
        id={id}
        className="adm-input-full"
        min={props.min ?? 0}
        max={props.max}
        step={props.step ?? 1}
        disabled={props.disabled}
        aria-label={props.ariaLabel}
        value={props.value}
        onChange={(value) => props.onChange(value ?? null)}
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
}: Pick<NumericInputProps, 'label' | 'suffix' | 'helper'> & {
  id: string
  children: ReactNode
}) {
  return (
    <div className="pricing-field">
      <label className="pricing-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="pricing-input-affix">
        {children}
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </div>
      {helper && <small>{helper}</small>}
    </div>
  )
}

/** Label + control cell of the pricing forms; the label is bound to the control through `id`. */
export function PricingField({
  id,
  label,
  wide = false,
  children,
}: {
  id: string
  label: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={`pricing-field${wide ? ' pricing-field-wide' : ''}`}>
      <label className="pricing-field-label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}
