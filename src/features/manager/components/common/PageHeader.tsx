import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  description?: ReactNode
  /** Small link/breadcrumb above the title (e.g. back to the list). */
  crumb?: ReactNode
  /** Right-aligned actions or status tags. */
  actions?: ReactNode
  /** Extra content under the description (tags, meta). */
  children?: ReactNode
}

/** White banner card that opens every Manager page (same look as the Dashboard hero). */
export function PageHeader({ title, description, crumb, actions, children }: Props) {
  return (
    <header className="mgr-page-head">
      <div className="mgr-page-head-main">
        {crumb ? <p className="mgr-page-head-crumb">{crumb}</p> : null}
        <h1 className="mgr-page-head-title">{title}</h1>
        {description ? <p className="mgr-page-head-desc">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="mgr-page-head-actions">{actions}</div> : null}
    </header>
  )
}
