import { Tag, Tooltip } from 'antd'

import { mockDataBadgeMessages } from '../../../../shared/components/ui/MockDataBadge.messages'
import { useI18n } from '../../../../shared/i18n'

/** Marks sections still backed by sample data (no backend endpoint yet). */
export function MockDataTag() {
  const { t } = useI18n(mockDataBadgeMessages)
  return (
    <Tooltip title={t.tip}>
      <Tag bordered={false}>{t.label}</Tag>
    </Tooltip>
  )
}
