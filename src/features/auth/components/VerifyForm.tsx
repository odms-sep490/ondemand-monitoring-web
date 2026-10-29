import { Button } from 'antd'

import { useI18n } from '../../../shared/i18n'
import { EmailField } from './EmailField'
import { OtpField } from './OtpField'
import { SubmitButton } from './SubmitButton'
import { verifyFormMessages } from './VerifyForm.messages'

export function VerifyForm({
  email,
  onEmailChange,
  otpCode,
  onOtpCodeChange,
  fieldErrors,
  isSubmitting,
  onResendOtp,
}: {
  email: string
  onEmailChange: (value: string) => void
  otpCode: string
  onOtpCodeChange: (value: string) => void
  fieldErrors: Record<string, string>
  isSubmitting: boolean
  onResendOtp: () => void
}) {
  const { t } = useI18n(verifyFormMessages)
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
        autoComplete="one-time-code"
      />
      <SubmitButton busy={isSubmitting}>
        {isSubmitting ? t.verifying : t.verify}
      </SubmitButton>
      <Button
        type="link"
        className="auth-link auth-resend"
        onClick={onResendOtp}
        disabled={isSubmitting}
      >
        {t.noCodeReceived} <strong>{t.resend}</strong>
      </Button>
    </>
  )
}
