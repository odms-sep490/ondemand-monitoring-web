import type { ReactNode } from 'react'

export function DetailSection({
  title,
  badge,
  children,
}: {
  title: string
  badge?: string
  children: ReactNode
}) {
  return (
    <section className="odm-or-detail-section">
      <header className="odm-or-detail-section-head">
        <h3>{title}</h3>
        {badge ? (
          <span className="odm-or-pill odm-or-pill-blue">{badge}</span>
        ) : null}
      </header>
      {children}
    </section>
  )
}
