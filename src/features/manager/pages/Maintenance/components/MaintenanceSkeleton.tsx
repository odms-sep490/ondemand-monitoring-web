import { Skeleton } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'

export function MaintenanceSkeleton() {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div aria-busy="true" aria-live="polite">
      <CardComponent>
        <Skeleton active paragraph={{ rows: 6 }} />
      </CardComponent>
      <span className="odm-visually-hidden">{t.page.loading}</span>
    </div>
  )
}
