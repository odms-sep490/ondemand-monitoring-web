import { Button, Input } from 'antd'
import { useState } from 'react'

import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { Field } from './Field'
import { passwordFieldMessages } from './PasswordField.messages'

export function PasswordField({
  id,
  value,
  onChange,
  label,
  hint,
  error,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
  hint?: string
  error?: string
}) {
  const { t } = useI18n(passwordFieldMessages)
  const [visible, setVisible] = useState(false)
  return (
    <Field label={label ?? t.label} htmlFor={id} hint={hint} error={error}>
      <Input
        id={id}
        name={id}
        size="large"
        status={error ? 'error' : undefined}
        prefix={<Icon name="lock" />}
        suffix={
          <Button
            type="text"
            size="small"
            className="auth-input-action"
            aria-label={visible ? t.hide : t.show}
            icon={<Icon name={visible ? 'eye-off' : 'eye'} />}
            onClick={() => setVisible(!visible)}
          />
        }
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={id === 'password' ? 'current-password' : 'new-password'}
        minLength={8}
        required
      />
    </Field>
  )
}
