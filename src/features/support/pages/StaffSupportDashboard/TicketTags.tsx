import { Tag } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import {
  StatusTag,
  type StatusTagTone,
} from '../../../manager/components/common/StatusTag'
import { staffSupportMessages } from './StaffSupportDashboard.messages'

const STATUS_TONE: Record<string, StatusTagTone> = {
  OPEN: 'info',
  ASSIGNED: 'warning',
  IN_PROGRESS: 'info',
  WAITING_FOR_CUSTOMER: 'warning',
  WAITING_FOR_STAFF: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
  CANCELLED: 'neutral',
}

const PRIORITY_TONE: Record<string, StatusTagTone> = {
  URGENT: 'danger',
  HIGH: 'warning',
  NORMAL: 'neutral',
}

function pick(labels: Record<string, string>, key: string): string {
  return labels[key] ?? key
}

export function TicketStatusTag({ status }: { status: string }) {
  const { t } = useI18n(staffSupportMessages)
  return (
    <StatusTag tone={STATUS_TONE[status] ?? 'neutral'}>
      {pick(t.status, status)}
    </StatusTag>
  )
}

export function TicketPriorityTag({ priority }: { priority: string }) {
  const { t } = useI18n(staffSupportMessages)
  return (
    <StatusTag tone={PRIORITY_TONE[priority] ?? 'neutral'}>
      {pick(t.priority, priority)}
    </StatusTag>
  )
}

export function TicketCategoryTag({ category }: { category: string }) {
  const { t } = useI18n(staffSupportMessages)
  return (
    <Tag bordered={false} className="sd-category-tag">
      {pick(t.category, category)}
    </Tag>
  )
}
