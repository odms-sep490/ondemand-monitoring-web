import { Skeleton } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { dronesPageMessages } from '../DronesPage.messages'

export function DronesSkeleton() {
  const { t } = useI18n(dronesPageMessages)
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mgr-drone-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <CardComponent key={i}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </CardComponent>
        ))}
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
