import type { ReactNode } from 'react'

type Props = {
  title?: ReactNode
  /** Optional slot on the right of the title row. */
  actions?: ReactNode
  children?: ReactNode
  className?: string
  /** Remove body padding, e.g. when the child is a full-bleed table. */
  flush?: boolean
  /** Lift slightly on hover (for clickable cards). */
  hoverable?: boolean
}

export function Card({ title, actions, children, className, flush, hoverable }: Props) {
  const hasHeader = Boolean(title || actions)
  return (
    <section className={`ui-card${hoverable ? ' is-hoverable' : ''}${className ? ` ${className}` : ''}`}>
      {hasHeader ? (
        <div className="ui-card-header">
          {title ? <h2 className="ui-card-title">{title}</h2> : <span />}
          {actions ? <div className="ui-card-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className={flush ? 'ui-card-body is-flush' : 'ui-card-body'}>
        {children}
      </div>
    </section>
  )
}
