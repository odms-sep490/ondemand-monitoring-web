import { Skeleton } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { COLUMNS } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'

export function MaintenanceSkeleton() {
  const { t } = useI18n(maintenancePageMessages)
  return (
      <div aria-busy="true" aria-live="polite" className="mgr-maint-board">
        {COLUMNS.map((col) => (
          <section key={col} className="mgr-maint-col">
            <div className="mgr-maint-col-list">
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          </section>
        ))}
        <span className="odm-visually-hidden">{t.page.loading}</span>
      </div>
  )
}
