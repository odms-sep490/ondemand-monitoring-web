import '../pageBanner.css'
import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  subtitle?: ReactNode
  /** Right-aligned slot, usually the primary call to action. */
  actions?: ReactNode
  /** Optional link/breadcrumb rendered above the title. */
  back?: ReactNode
}

export function PageHeader({ title, subtitle, actions, back }: Props) {
  return (
    <header className="ui-page-header app-page-banner">
      {back ? <div className="ui-page-back">{back}</div> : null}
      <div className="ui-page-header-row">
        <div className="ui-page-header-text">
          <h1 className="ui-page-title">{title}</h1>
          {subtitle ? <p className="ui-page-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="ui-page-actions">{actions}</div> : null}
      </div>
    </header>
  )
}
