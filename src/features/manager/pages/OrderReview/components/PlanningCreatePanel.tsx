import { CloseOutlined } from '@ant-design/icons'
import type { Dispatch, SetStateAction } from 'react'
import type { usePlanningConfirmation } from '../../../components/common/usePlanningConfirmation'
import { MissionCreatePage } from '../../MissionCreate/MissionCreatePage'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail } from '../../../types/orders'
import type { Invoice } from '../../../../finance/types'
import { Button, Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { planningCreatePanelMessages } from './PlanningCreatePanel.messages'

export function PlanningCreatePanel({
  confirmation,
  setCreating,
  orderId,
  setSelectedId,
  query,
}: {
  confirmation: ReturnType<typeof usePlanningConfirmation>
  setCreating: Dispatch<SetStateAction<{} | null>>
  orderId: string
  setSelectedId: Dispatch<SetStateAction<string | null>>
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    invoice: Invoice | null
  }>
}) {
  const { t } = useI18n(planningCreatePanelMessages)
  return (
    <Card
      title={t.title}
      className="mgr-plan-create"
      actions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t.closeFormLabel}
          title={t.closeFormTitle}
          onClick={async () => {
            if (
              await confirmation.confirm({
                title: t.confirmTitle,
                body: t.confirmBody,
                action: t.confirmAction,
              })
            ) {
              setCreating(null)
            }
          }}
        >
          <CloseOutlined aria-hidden="true" />
        </Button>
      }
    >
      <section aria-label={t.panelLabel}>
        <p className="mgr-muted">{t.intro}</p>
        <MissionCreatePage
          orderId={orderId}
          onCreated={(id) => {
            setSelectedId(id)
            setCreating(null)
            query.reload()
          }}
        />
      </section>
    </Card>
  )
}
