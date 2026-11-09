import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  /** Optional icon rendered in a tinted tile above the title. */
  icon?: ReactNode
}

/** Centered empty/placeholder block for cards and tables. */
export function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div className="mgr-empty">
      {icon ? (
        <span className="mgr-tile mgr-tone-blue" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="mgr-empty-title">{title}</div>
      {description ? <div className="mgr-empty-desc">{description}</div> : null}
      {action ? <div className="mgr-empty-action">{action}</div> : null}
    </div>
  )
}
