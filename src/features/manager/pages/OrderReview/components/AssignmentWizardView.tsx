import { PageHeader } from '../../../../../shared/components/ui'
import { WorkflowStepper } from '../../../components/common/WorkflowStepper'
import { missionLayer } from '../reviewHelpers'
import { orderDeliverableLabels } from './OrderServiceBanner'
import { OrderResourceAssignmentWizard } from '../../../components/common/OrderResourceAssignmentWizard'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import { assignmentWizardViewMessages } from './AssignmentWizardView.messages'
import { OrderDetailsDrawer } from '../../../components/common/OrderDetailsDrawer'
import type { PlanningWorkflowInfo } from './OrderMissionPlanningSection'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { OrderDetail } from '../../../types/orders'
import type { Dispatch, SetStateAction } from 'react'

export function AssignmentWizardView({
  planning,
  assigningMissionId,
  assignStep,
  orderQuery,
  orderData,
  orderId,
  setAssignStep,
  setAssigningMissionId,
}: {
  planning: PlanningWorkflowInfo | null
  assigningMissionId: string
  assignStep: 6 | 7 | 8 | 9
  orderQuery: UseApiQueryState<OrderDetail>
  orderData: OrderDetail
  orderId: string
  setAssignStep: Dispatch<SetStateAction<6 | 7 | 8 | 9>>
  setAssigningMissionId: Dispatch<SetStateAction<string | null>>
}) {
  const { t, locale, lang } = useI18n(orderReviewPageMessages)
  const { t: tw } = useI18n(assignmentWizardViewMessages)
  return (
    <div className="odm-or odm-or-review-page">
      <div className="odm-or-review-top">
        <PageHeader
          title={tw.title}
          subtitle={tw.subtitle}
          actions={<OrderDetailsDrawer order={orderData} />}
        />
        <WorkflowStepper
          compactOrder
          order={{
            progress: { current: 'complete', waiting: false, terminal: null },
          }}
          mission={missionLayer(
            planning,
            assigningMissionId === '__select_mission__'
              ? null
              : assigningMissionId,
            lang,
            assignStep >= 8 ? 'review' : 'permit',
          )}
        />
        <div className="odm-assign-context" aria-label={t.serviceEyebrow}>
          <strong>{orderData.serviceName}</strong>
          {orderDeliverableLabels(orderData, locale).length > 0 && (
            <span>
              {t.deliverableFormat}:{' '}
              {orderDeliverableLabels(orderData, locale).join(', ')}
            </span>
          )}
        </div>
      </div>
      <OrderResourceAssignmentWizard
        orderId={orderId}
        initialMissionId={
          assigningMissionId === '__select_mission__'
            ? undefined
            : assigningMissionId
        }
        embedded
        returnLabel={tw.finishAssignment}
        onStepChange={setAssignStep}
        onClose={() => {
          setAssigningMissionId(null)
          orderQuery.reload()
        }}
      />
    </div>
  )
}
