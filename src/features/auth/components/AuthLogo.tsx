import { useI18n } from '../../../shared/i18n'
import { authLogoMessages } from './AuthLogo.messages'
import { BrandMark } from './BrandMark'

export function AuthLogo() {
  const { t } = useI18n(authLogoMessages)
  return (
    <a className="odm-auth-logo" href="#top" aria-label={t.homeAriaLabel}>
      <BrandMark />
      <span className="odm-auth-brand-name">
        <span className="odm-auth-brand-primary">OnDemand</span>
        <span className="odm-auth-brand-accent">Monitor</span>
      </span>
    </a>
  )
}
