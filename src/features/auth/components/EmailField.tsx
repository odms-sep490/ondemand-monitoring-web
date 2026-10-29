import { Input } from 'antd'

import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { emailFieldMessages } from './EmailField.messages'
import { Field } from './Field'

export function EmailField({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const { t } = useI18n(emailFieldMessages)
  return (
    <Field label={t.label} htmlFor="email" error={error}>
      <Input
        id="email"
        name="email"
        size="large"
        status={error ? 'error' : undefined}
        prefix={<Icon name="mail" />}
        type="email"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t.placeholder}
        autoComplete="email"
        required
      />
    </Field>
  )
}
