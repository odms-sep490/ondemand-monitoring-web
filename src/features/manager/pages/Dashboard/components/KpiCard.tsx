export function KpiCard({
  label,
  value,
  detail,
  href,
  tone = 'primary',
}: {
  label: string
  value: ReactNode
  detail: string
  href: string
  tone?: 'primary' | 'warning' | 'danger'
}) {
  return (
    <a className={`odm-card odm-mgr-kpi is-${tone}`} href={href}>
      <span className="odm-mgr-kpi-label">{label}</span>
      <span className="odm-mgr-kpi-number odm-tn">{value}</span>
      <span className="odm-mgr-kpi-detail">{detail}</span>
    </a>
  )
}
import type { ReactNode } from 'react'

