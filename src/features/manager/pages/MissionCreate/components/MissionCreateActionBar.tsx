import { OrderIcon } from '../../../components/common/OrderIcon'
import { managerHref } from '../../../routes'
import { missionCreatePageMessages } from '../MissionCreatePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import { Button } from 'antd'
import { RightOutlined } from '@ant-design/icons'

export function MissionCreateActionBar({
  handleSubmit,
  submitting,
  planQuery,
  replacementQuery,
  replacesMissionId,
  orderId,
}: {
  handleSubmit: () => Promise<void>
  submitting: boolean
  planQuery: UseApiQueryState<ExecutionPlan>
  replacementQuery: UseApiQueryState<MissionResponse | null>
  replacesMissionId: string | undefined
  orderId: string
}) {
  const { t } = useI18n(missionCreatePageMessages)
  return (
    <div className="odm-or-actionbar">
      <div className="odm-or-actionbar-hint">
        <span className="odm-or-actionbar-hint-icon">
          <OrderIcon name="info" size={18} />
        </span>
        <span>{t.actionHint}</span>
      </div>
      <div className="odm-or-actionbar-actions">
        <Button
          type="text"
          href={managerHref({ screen: 'orderQueue' })}
        >
          {t.backToOrders}
        </Button>
        <Button
          type="primary"
          htmlType="button"
          onClick={handleSubmit}
          disabled={
            submitting ||
            planQuery.loading ||
            Boolean(planQuery.error) ||
            (planQuery.data?.planStatus !== 'DRAFT' &&
              !(replacesMissionId && planQuery.data?.planStatus === 'FINALIZED')) ||
            replacementQuery.loading ||
            Boolean(replacementQuery.error) ||
            Boolean(
              replacesMissionId &&
              (replacementQuery.data?.status !== 'CANCELLED' ||
                replacementQuery.data.orderId !== orderId),
            )
          }
        >
          {submitting ? t.creating : t.createMission}
          <RightOutlined aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
