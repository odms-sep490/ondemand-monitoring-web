import { useI18n } from '../../../shared/i18n'
import { Icon, type IconName } from '../../../shared/components/Icon'
import { authAsideMessages } from './AuthAside.messages'
import { BrandMark } from './BrandMark'

/** Brand panel: gradient, logo, headline and the three value points. */
export function AuthAside() {
  const { t } = useI18n(authAsideMessages)
  return (
    <aside className="auth-brand" aria-label={t.asideLabel}>
      <div className="auth-brand-top">
        <BrandMark size={44} />
        <div>
          <p className="auth-brand-name">OnDemand Monitor</p>
          <p className="auth-brand-sub">{t.brandSubtitle}</p>
        </div>
      </div>
      <div className="auth-brand-body">
        <p className="auth-brand-title">
          {t.heroTitle} <span>{t.heroAccent}</span>
        </p>
        <p className="auth-brand-desc">{t.heroDescription}</p>
        <ul className="auth-brand-points">
          {(t.valueProps as { icon: IconName; text: string }[]).map((item) => (
            <li key={item.text}>
              <span className="auth-brand-tile" aria-hidden="true">
                <Icon name={item.icon} />
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
