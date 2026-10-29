import { Tag } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { roleBadgeMessages } from './RoleBadge.messages'

const KNOWN = ['ADMIN', 'STAFF', 'MANAGER', 'CUSTOMER']

/** antd Tag preset per backend role enum value (presets resolve through the theme tokens). */
const ROLE_COLOR: Record<string, string> = {
  admin: 'purple',
  manager: 'blue',
  staff: 'cyan',
  customer: 'green',
  unknown: 'default',
}

/** Read-only role chip; one colour per backend role enum value. */
export function RoleBadge({ role }: { role: string }) {
  const { t } = useI18n(roleBadgeMessages)
  const tone = KNOWN.includes(role) ? role.toLowerCase() : 'unknown'
  return (
    <Tag bordered={false} color={ROLE_COLOR[tone]} className={`adm-role is-${tone}`} data-role={role}>
      {t.labels[role] ?? role}
    </Tag>
  )
}
