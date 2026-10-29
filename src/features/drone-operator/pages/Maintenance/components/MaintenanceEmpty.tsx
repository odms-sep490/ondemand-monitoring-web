import { ToolOutlined } from '@ant-design/icons'

import {
  CardComponent,
  EmptyState,
} from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'

export function MaintenanceEmpty() {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <CardComponent>
      <EmptyState
        icon={<ToolOutlined />}
        title={t.emptyTitle}
        description={t.emptyBody}
      />
    </CardComponent>
  )
}
