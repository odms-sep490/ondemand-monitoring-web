import { Button, Checkbox } from 'antd'

import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import { EmailField } from './EmailField'
import { loginFormMessages } from './LoginForm.messages'
import { PasswordField } from './PasswordField'
import { SubmitButton } from './SubmitButton'

export function LoginForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  rememberMe,
  onRememberMeChange,
  fieldErrors,
  isSubmitting,
  onGoogleSignIn,
  onForgotPassword,
}: {
  email: string
  onEmailChange: (value: string) => void
  password: string
  onPasswordChange: (value: string) => void
  rememberMe: boolean
  onRememberMeChange: (value: boolean) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onGoogleSignIn: () => void
  onForgotPassword: () => void
}) {
  const { t } = useI18n(loginFormMessages)
  return (
    <>
      <Button
        size="large"
        block
        className="auth-google"
        icon={<Icon name="google" />}
        onClick={onGoogleSignIn}
      >
        {t.continueWithGoogle}
      </Button>
      <div className="auth-divider" aria-hidden="true">
        <span>{t.orDivider}</span>
      </div>
      <EmailField
        value={email}
        onChange={onEmailChange}
        error={fieldErrors.email}
      />
      <PasswordField
        id="password"
        value={password}
        onChange={onPasswordChange}
        error={fieldErrors.password}
      />
      <div className="auth-row">
        <Checkbox
          checked={rememberMe}
          onChange={(event) => onRememberMeChange(event.target.checked)}
        >
          {t.rememberMe}
        </Checkbox>
        <Button type="link" className="auth-link" onClick={onForgotPassword}>
          {t.forgotPassword}
        </Button>
      </div>
      <SubmitButton busy={isSubmitting}>
        {isSubmitting ? t.signingIn : t.signIn}
      </SubmitButton>
    </>
  )
}
