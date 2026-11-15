import { useEffect, useState } from 'react'
import { Button, Tabs } from 'antd'
import { PageHeader } from '../../components/common/PageHeader'
import { managerHref } from '../../routes'
import { useI18n } from '../../../../shared/i18n'
import { missionCreatePageMessages } from './MissionCreatePage.messages'
import { OrderMissionPlanningSection } from '../OrderReview/components/OrderMissionPlanningSection'
export function InternalCorrectionPlanningPage({
  orderId,
  sourceMissionId,
  correctionId,
}: {
  orderId: string
  sourceMissionId: string
  correctionId: string
}) {
  const { t } = useI18n(missionCreatePageMessages)
  const [tab, setTab] = useState<'planning' | 'permit'>('planning')
  const [finalized, setFinalized] = useState(false)
  useEffect(() => setTab(finalized ? 'permit' : 'planning'), [finalized])
  return (
    <div className="odm-or mgr-view">
      <PageHeader
        title={t.internalTitle}
        description={t.internalDescription}
        actions={
          <Button
            href={managerHref({
              screen: 'missionDetail',
              missionId: sourceMissionId,
            })}
          >
            {t.backToSource}
          </Button>
        }
      />
      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key === 'permit' ? 'permit' : 'planning')}
        items={[
          { key: 'planning', label: t.planningTab },
          { key: 'permit', label: t.permitTab, disabled: !finalized },
        ]}
      />
      <OrderMissionPlanningSection
        orderId={orderId}
        inspectionContext={{ sourceMissionId, correctionId }}
        activeTab={tab}
        onWorkflowInfo={(info) => setFinalized(info.isFinalized === true)}
        onBackToPlanning={() => setTab('planning')}
      />
    </div>
  )
}
