import { Tag } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { roleBadgeMessages } from './RoleBadge.messages'

const KNOWN = ['ADMIN', 'STAFF', 'MANAGER', 'CUSTOMER']

/** Read-only role tag; one colour per backend role enum value (see admin.scss). */
export function RoleBadge({ role }: { role: string }) {
  const { t } = useI18n(roleBadgeMessages)
  const tone = KNOWN.includes(role) ? role.toLowerCase() : 'unknown'
  return (
    <Tag bordered={false} className={`adm-role is-${tone}`} data-role={role}>
      {t.labels[role] ?? role}
    </Tag>
  )
}
