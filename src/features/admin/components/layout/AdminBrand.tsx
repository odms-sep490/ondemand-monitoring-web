import { adminHref } from '../../routes'

export function AdminBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <a
      className="mgr-brand"
      href={adminHref({ screen: 'dashboard' })}
      onClick={onNavigate}
    >
      <span className="mgr-brand-tile">
        <img
          src="/images/logo-new.png"
          alt="OnDemand Monitor"
          className="mgr-brand-mark"
        />
      </span>
      <span className="mgr-brand-name">
        <span className="mgr-brand-primary">OnDemand</span>
        <span className="mgr-brand-accent">Monitor</span>
      </span>
    </a>
  )
}
