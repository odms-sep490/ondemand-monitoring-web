import { Skeleton } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { missionCreatePageMessages } from '../MissionCreatePage.messages'

export function CreateMissionSkeleton() {
  const { t } = useI18n(missionCreatePageMessages)
  return (
    <div className="odm-or mgr-view" aria-busy="true" aria-live="polite">
      <CardComponent>
        <Skeleton active paragraph={{ rows: 1 }} />
      </CardComponent>
      <CardComponent>
        <Skeleton active paragraph={{ rows: 4 }} />
      </CardComponent>
      <CardComponent>
        <Skeleton active paragraph={{ rows: 5 }} />
      </CardComponent>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
