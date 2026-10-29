import { Card, type CardProps } from 'antd'
import type { ReactNode } from 'react'

type Props = CardProps & {
  /** Icon shown in a gradient tile before the title. */
  icon?: ReactNode
  /** Tile colour; defaults to blue. */
  tone?: 'blue' | 'green' | 'amber' | 'violet' | 'red' | 'cyan'
}

/**
 * antd Card wrapper (mirrors the reference `CardComponent`). A plain string
 * `title` is rendered as an <h3> so sections stay discoverable as headings.
 */
export function CardComponent({ className = '', title, icon, tone = 'blue', ...props }: Props) {
  const heading =
    typeof title === 'string' ? (
      <span className="mgr-card-head">
        {icon ? (
          <span className={`mgr-tile mgr-tile-sm mgr-tone-${tone}`} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <h3 className="mgr-card-title">{title}</h3>
      </span>
    ) : (
      title
    )
  return <Card className={`mgr-card ${className}`.trim()} title={heading} {...props} />
}
