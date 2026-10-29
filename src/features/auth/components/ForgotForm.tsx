import { Button } from 'antd'

import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { EmailField } from './EmailField'
import { forgotFormMessages } from './ForgotForm.messages'
import { SubmitButton } from './SubmitButton'

export function ForgotForm({
  email,
  onEmailChange,
  fieldErrors,
  isSubmitting,
  onBackToLogin,
}: {
  email: string
  onEmailChange: (value: string) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onBackToLogin: () => void
}) {
  const { t } = useI18n(forgotFormMessages)
  return (
    <>
      <EmailField
        value={email}
        onChange={onEmailChange}
        error={fieldErrors.email}
      />
      <SubmitButton busy={isSubmitting}>
        {isSubmitting ? t.sending : t.sendResetCode}
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
