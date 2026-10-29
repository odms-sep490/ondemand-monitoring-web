import { useI18n } from '../../../shared/i18n'
import { EmailField } from './EmailField'
import { firstLoginFormMessages } from './FirstLoginForm.messages'
import { PasswordField } from './PasswordField'
import { SubmitButton } from './SubmitButton'

export function FirstLoginForm({
  email,
  onEmailChange,
  newPassword,
  onNewPasswordChange,
  fieldErrors,
  isSubmitting,
  challengeSession,
}: {
  email: string
  onEmailChange: (value: string) => void
  newPassword: string
  onNewPasswordChange: (value: string) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  challengeSession: string
}) {
  const { t } = useI18n(firstLoginFormMessages)
  return (
    <>
      <EmailField
        value={email}
        onChange={onEmailChange}
        error={fieldErrors.email}
      />
      <PasswordField
        id="newPassword"
        label={t.newPasswordLabel}
        value={newPassword}
        onChange={onNewPasswordChange}
        hint={t.passwordHint}
        error={fieldErrors.newPassword}
      />
      <SubmitButton busy={isSubmitting} disabled={!challengeSession}>
        {isSubmitting ? t.saving : t.continue}
      </SubmitButton>
    </>
  )
}
