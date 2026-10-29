import { useI18n } from '../../../shared/i18n'
import { authLogoMessages } from './AuthLogo.messages'
import { BrandMark } from './BrandMark'

export function AuthLogo() {
  const { t } = useI18n(authLogoMessages)
  return (
    <a className="auth-logo" href="#" aria-label={t.homeAriaLabel}>
      <BrandMark size={36} />
      <span className="auth-logo-name">
        <span>OnDemand</span> <span className="auth-logo-accent">Monitor</span>
      </span>
    </a>
  )
}
