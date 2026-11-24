import { FlightPurposeDraftReview } from '../../../../contract/FlightPurposeDraftReview'
import { FlightPermitCard } from '../../../components/common/FlightPermitCard'
import { ordersApi } from '../../../api/ordersApi'
import { financeApi } from '../../../../finance/api'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import type { MissionResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'

export function MissionPermitPanel({ mission, onUpdated }: { mission: MissionResponse; onUpdated: () => void }) {
  const { t } = useI18n(missionDetailPageMessages)
  const permitContext = useApiQuery(async (signal) => {
    const [order, invoice] = await Promise.all([
      ordersApi.getOrder(mission.orderId, signal),
      financeApi.getManagerInvoice(mission.orderId, signal).catch(() => null),
    ])
    const depositPaid = Boolean(invoice &&
      !['CANCELLED', 'REFUNDED', 'OVERDUE'].includes(invoice.status) &&
      (invoice.depositStatus === 'DEPOSIT_PAID' || invoice.paidAmount >= invoice.depositAmount))
    return { order, depositPaid }
  }, [mission.orderId, mission.flightPermitStatus])
  const order = permitContext.data?.order
  const depositPaid = permitContext.data?.depositPaid ?? false
  const orderPermitRejected = order?.legalReviewStatus === 'REJECTED'
  const permitReadOnly = ['PLANNING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(mission.status)
  return (
    <section className="mgr-mission-plan" aria-label={t.tabs.permit}>
      <FlightPurposeDraftReview missionId={mission.id} />
      <FlightPermitCard
        key={mission.id}
        showResources={false}
        mission={mission}
        onChanged={() => {
          permitContext.reload()
          onUpdated()
        }}
        readOnly={permitReadOnly}
        depositPaid={depositPaid}
        orderPermitRejected={orderPermitRejected}
        refundEligible={order?.status === 'APPROVED' && orderPermitRejected &&
          mission.flightPermitStatus === 'REJECTED' && depositPaid}
      />
    </section>
  )
}
