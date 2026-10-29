import { CalendarOutlined, ToolOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { PageHeader } from '../../../../../shared/components/antd'
import { headerDateLabel } from '../missionListHelpers'
import { operatorHref } from '../../../routes'
import { missionListPageMessages } from '../MissionListPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { OperatorProfile } from '../../../types/mission'

export function MissionListHeader({
  profile,
  now,
}: {
  profile: OperatorProfile
  now: Date
}) {
  const { t } = useI18n(missionListPageMessages)
  return (
    <PageHeader
      title={t.title}
      description={
        <>
          {profile.fullName}
          {profile.rank ? t.pilotRank(profile.rank) : ''} ·{' '}
          {headerDateLabel(now, t)}
        </>
      }
      actions={
        <>
          <Button
            icon={<CalendarOutlined />}
            href={operatorHref({ screen: 'availability' })}
          >
            {t.declareAvailability}
          </Button>
          <Button
            icon={<ToolOutlined />}
            href={operatorHref({ screen: 'maintenance' })}
          >
            {t.manageMaintenance}
          </Button>
        </>
      }
    />
  )
}
