import { OrderIcon } from '../../../components/common/OrderIcon'
import { managerHref } from '../../../routes'
import { Button } from '../../../../../shared/components/Button'
import { missionCreatePageMessages } from '../MissionCreatePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'

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
        <a
          className="odm-or-btn odm-or-btn-ghost"
          href={managerHref({ screen: 'orderQueue' })}
        >
          {t.backToOrders}
        </a>
        <Button
          type="button"
          className="odm-or-btn odm-or-btn-primary"
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
          <OrderIcon name="chevron-right" size={16} />
        </Button>
      </div>
    </div>
  )
}
