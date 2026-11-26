import type { ReactNode } from 'react'

export function DetailSection({
  title,
  badge,
  badgeTone = 'blue',
  children,
}: {
  title: string
  badge?: string
  badgeTone?: string
  children: ReactNode
}) {
  return (
    <section className="odm-or-detail-section">
      <header className="odm-or-detail-section-head">
        <h3>{title}</h3>
        {badge ? (
          <span className={`odm-or-pill odm-or-pill-${badgeTone}`}>{badge}</span>
        ) : null}
      </header>
      {children}
    </section>
  )
}
