import { Checkbox, Input } from 'antd'

import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { EmailField } from './EmailField'
import { Field } from './Field'
import { PasswordField } from './PasswordField'
import { registerFormMessages } from './RegisterForm.messages'
import { SubmitButton } from './SubmitButton'

export function RegisterForm({
  fullName,
  onFullNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  fieldErrors,
  isSubmitting,
}: {
  fullName: string
  onFullNameChange: (value: string) => void
  email: string
  onEmailChange: (value: string) => void
  password: string
  onPasswordChange: (value: string) => void
  confirmPassword: string
  onConfirmPasswordChange: (value: string) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
}) {
  const { t } = useI18n(registerFormMessages)
  return (
    <>
      <Field
        label={t.fullNameLabel}
        htmlFor="fullName"
        hint={t.fullNameHint}
        error={fieldErrors.fullName}
      >
        <Input
          id="fullName"
          name="fullName"
          size="large"
          status={fieldErrors.fullName ? 'error' : undefined}
          prefix={<Icon name="users" />}
          type="text"
          value={fullName}
          onChange={(event) => onFullNameChange(event.target.value)}
          placeholder={t.fullNamePlaceholder}
          maxLength={100}
          autoComplete="name"
          required
        />
      </Field>
      <EmailField
        value={email}
        onChange={onEmailChange}
        error={fieldErrors.email}
      />
      <PasswordField
        id="password"
        value={password}
        onChange={onPasswordChange}
        hint={t.passwordHint}
        error={fieldErrors.password}
      />
      <PasswordField
        id="confirmPassword"
        label={t.confirmPasswordLabel}
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        error={fieldErrors.confirmPassword}
      />
      <Checkbox className="auth-terms" required>
        {t.termsLabel}
      </Checkbox>
      <SubmitButton busy={isSubmitting}>
        {isSubmitting ? t.creatingAccount : t.createAccount}
      </SubmitButton>
    </>
  )
}
