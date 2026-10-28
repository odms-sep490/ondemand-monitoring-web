/**
 * Customer-portal building blocks with the shared `shared/components/ui` call
 * signatures, rendered with the Manager antd look (CardComponent, PageHeader).
 * Pages import from here so the data-flow code stays untouched.
 */
import type { ReactNode } from 'react'

import {
  CardComponent,
  EmptyState as AntEmptyState,
  PageHeader as AntPageHeader,
  StatisticComponent,
} from '../../../../shared/components/antd'

export { FormField, MockDataBadge, Modal } from '../../../../shared/components/ui'

type CardProps = {
  title?: ReactNode
  /** Slot on the right of the title row. */
  actions?: ReactNode
  children?: ReactNode
  className?: string
  /** Remove body padding, e.g. for full-bleed tables. */
  flush?: boolean
  hoverable?: boolean
  icon?: ReactNode
}

export function Card({ title, actions, children, className, flush, hoverable, icon }: CardProps) {
  return (
    <CardComponent
      title={title}
      icon={icon}
      extra={actions}
      hoverable={hoverable}
      className={className}
      styles={flush ? { body: { padding: 0 } } : undefined}
    >
      {children}
    </CardComponent>
  )
}

type PageHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  back?: ReactNode
  children?: ReactNode
}

/** Hero banner; `back` becomes the small link above the title. */
export function PageHeader({ title, subtitle, actions, back, children }: PageHeaderProps) {
  return (
    <AntPageHeader title={title} description={subtitle} actions={actions} crumb={back}>
      {children}
    </AntPageHeader>
  )
}

/** Centered empty block (no card; place it inside a Card). */
export const EmptyState = AntEmptyState

type StatTone = 'default' | 'success' | 'warning' | 'danger'
const STAT_TONE = { default: 'blue', success: 'green', warning: 'amber', danger: 'red' } as const

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: StatTone
  icon?: ReactNode
}) {
  return (
    <StatisticComponent
      title={label}
      value={value as string | number}
      hint={hint}
      tone={STAT_TONE[tone]}
      icon={icon}
    />
  )
}
