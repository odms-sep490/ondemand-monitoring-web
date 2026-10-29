import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ReactNode } from 'react'

import { ErrorState } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { checklistMessages } from './checklists.messages'
import './checklists.css'

export function ChecklistIconButton({
  icon,
  label,
  danger = false,
  disabled,
  onClick,
}: {
  icon: ReactNode
  label: string
  danger?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <Button
      type="text"
      danger={danger}
      icon={icon}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    />
  )
}

export function ChecklistPagination({
  page,
  totalPages,
  first,
  last,
  busy = false,
  change,
}: {
  page: number
  totalPages?: number
  first: boolean
  last: boolean
  busy?: boolean
  change: (page: number) => void
}) {
  const { t } = useI18n(checklistMessages)
  return (
    <nav className="checklist-pagination" aria-label={t.pagination}>
      <span>
        {t.page} {page + 1}
        {totalPages !== undefined ? ' / ' + Math.max(1, totalPages) : ''}
      </span>
      <div className="checklist-actions">
        <Button icon={<ArrowLeftOutlined aria-hidden="true" aria-label={undefined} />} disabled={busy || first} onClick={() => change(page - 1)}>
          {t.previous}
        </Button>
        <Button disabled={busy || last} onClick={() => change(page + 1)}>
          {t.next}
          <ArrowRightOutlined aria-hidden="true" aria-label={undefined} />
        </Button>
      </div>
    </nav>
  )
}

export function ChecklistLoadError({
  title,
  error,
  retry,
}: {
  title: string
  error: unknown
  retry: () => void
}) {
  // Preserve shared technical detail as secondary information, never the main heading.
  return <ErrorState title={title} error={error} onRetry={retry} />
}
