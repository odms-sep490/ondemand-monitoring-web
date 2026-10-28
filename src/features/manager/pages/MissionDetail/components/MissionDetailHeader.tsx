import { Button } from 'antd'
import { ArrowLeftOutlined, RightOutlined } from '@ant-design/icons'

import { MissionStatusTag } from '../../../components/common/MissionStatusTag'
import { PageHeader } from '../../../components/common/PageHeader'
import { managerHref } from '../../../routes'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionResponse } from '../../../types/missions'

export function MissionDetailHeader({
  mission,
  headline,
  canSetup,
}: {
  mission: MissionResponse
  headline: string | null
  canSetup: boolean
}) {
  const { t } = useI18n(missionDetailPageMessages)
  return (
    <PageHeader
      crumb={
        <a href={managerHref({ screen: 'missions' })}>
          <ArrowLeftOutlined aria-hidden="true" /> {t.back}
        </a>
      }
      title={
        <span className="mgr-title-row">
          <span className="odm-mono">{mission.missionCode}</span>
          <MissionStatusTag mission={mission} />
        </span>
      }
      description={headline ?? t.noDescription}
      actions={
        <>
          <Button href={managerHref({ screen: 'orderReview', orderId: mission.orderId })}>
            {t.viewOrderPlan}
            <RightOutlined aria-hidden="true" />
          </Button>
          {canSetup ? (
            <Button
              type="primary"
              href={managerHref({ screen: 'missionSetup', missionId: mission.id })}
            >
              {t.continueSetup}
            </Button>
          ) : null}
        </>
      }
    />
  )
}
