import { Input } from 'antd'

import { Icon } from '../../../shared/components/Icon'
import { Field } from './Field'

/** Six-digit code input shared by the verify and reset forms. */
export function OtpField({
  label,
  hint,
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
  error?: string
  autoComplete?: string
}) {
  return (
    <Field label={label} htmlFor="otpCode" hint={hint} error={error}>
      <Input
        id="otpCode"
        name="otpCode"
        size="large"
        status={error ? 'error' : undefined}
        prefix={<Icon name="ticket" />}
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        autoComplete={autoComplete}
        required
      />
    </Field>
  )
}
