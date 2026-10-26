import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

/** Centered empty/placeholder block for cards and tables. */
export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="mgr-empty">
      <div className="mgr-empty-title">{title}</div>
      {description ? <div className="mgr-empty-desc">{description}</div> : null}
      {action ? <div className="mgr-empty-action">{action}</div> : null}
    </div>
  )
}
