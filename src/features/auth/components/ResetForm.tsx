import { Button } from 'antd'

import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { EmailField } from './EmailField'
import { OtpField } from './OtpField'
import { PasswordField } from './PasswordField'
import { resetFormMessages } from './ResetForm.messages'
import { SubmitButton } from './SubmitButton'

export function ResetForm({
  email,
  onEmailChange,
  otpCode,
  onOtpCodeChange,
  newPassword,
  onNewPasswordChange,
  fieldErrors,
  isSubmitting,
  onBackToLogin,
}: {
  email: string
  onEmailChange: (value: string) => void
  otpCode: string
  onOtpCodeChange: (value: string) => void
  newPassword: string
  onNewPasswordChange: (value: string) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onBackToLogin: () => void
}) {
  const { t } = useI18n(resetFormMessages)
  return (
    <>
      <EmailField
        value={email}
        onChange={onEmailChange}
        error={fieldErrors.email}
      />
      <OtpField
        label={t.codeLabel}
        hint={t.codeHint}
        value={otpCode}
        onChange={onOtpCodeChange}
        error={fieldErrors.otpCode}
      />
      <PasswordField
        id="newPassword"
        label={t.newPasswordLabel}
        value={newPassword}
        onChange={onNewPasswordChange}
        hint={t.passwordHint}
        error={fieldErrors.newPassword}
      />
      <SubmitButton busy={isSubmitting}>
        {isSubmitting ? t.resetting : t.resetPassword}
      </SubmitButton>
      <Button
        type="link"
        className="auth-link auth-back"
        icon={<Icon name="arrow-left" />}
        onClick={onBackToLogin}
      >
        {t.backToLogin}
      </Button>
    </>
  )
}
