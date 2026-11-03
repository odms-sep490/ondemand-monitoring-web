import { useEffect, useState } from 'react'
import { Button, Tabs } from 'antd'
import { useI18n } from '../../../../shared/i18n'
import { PageHeader } from '../../components/common/PageHeader'
import { managerHref } from '../../routes'
import { OrderMissionPlanningSection } from '../OrderReview/components/OrderMissionPlanningSection'
import { missionCreatePageMessages } from './MissionCreatePage.messages'

/** Reuses the current Order planning workspace, scoped to one revision case. */
export function ReworkPlanningPage({
  orderId,
  caseId,
}: {
  orderId: string
  caseId: string
}) {
  const { t } = useI18n(missionCreatePageMessages)
  const [tab, setTab] = useState<'planning' | 'permit'>('planning')
  const [finalized, setFinalized] = useState(false)
  useEffect(() => {
    setTab(finalized ? 'permit' : 'planning')
  }, [finalized])
  return (
    <div className="odm-or mgr-view">
      <PageHeader
        title={t.reworkWorkspaceTitle}
        description={t.reworkDescription}
        actions={
          <Button href={managerHref({ screen: 'orderResults', orderId })}>
            {t.backToResults}
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
        reworkCaseId={caseId}
        activeTab={tab}
        onWorkflowInfo={(info) => setFinalized(info.isFinalized === true)}
        onBackToPlanning={() => setTab('planning')}
      />
    </div>
  )
}
