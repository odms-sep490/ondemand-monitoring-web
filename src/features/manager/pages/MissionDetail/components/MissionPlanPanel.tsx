import { FlightPermitCard } from '../../../components/common/FlightPermitCard'
import { ordersApi } from '../../../api/ordersApi'
import { financeApi } from '../../../../finance/api'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { Descriptions } from 'antd'
import { useState } from 'react'
import { MissionResourceReplacementDialog, type ReplacementTarget } from './MissionResourceReplacementDialog'
import type { MissionResponse } from '../../../types/missions'
import { formatDateTime, formatDuration, formatNumber } from '../../../components/common/missionDetailHelpers'
import { MissionCrewCard } from './MissionCrewCard'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'

export function MissionPlanPanel({ mission, onUpdated }: { mission: MissionResponse; onUpdated: () => void }) {
  const [target, setTarget] = useState<ReplacementTarget | null>(null)
  const canReplace = ['PENDING_CONFIRMATION', 'READY'].includes(mission.status)
  const { t, locale } = useI18n(missionDetailPageMessages)
  const plan = mission.plan
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
    <section className="mgr-mission-plan" aria-label={t.tabs.plan}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} items={[
        ...(mission.scheduledStartAt ? [{ key: 'start', label: t.fields.scheduledStart, children: formatDateTime(mission.scheduledStartAt, locale) }] : []),
        ...(mission.scheduledEndAt ? [{ key: 'end', label: t.fields.scheduledEnd, children: formatDateTime(mission.scheduledEndAt, locale) }] : []),
        ...(plan?.plannedDistanceM != null && Number.isFinite(plan.plannedDistanceM) ? [{ key: 'distance', label: t.map.distance, children: formatNumber(plan.plannedDistanceM, ' m') }] : []),
        ...(plan?.maxPlannedAltitudeM != null && Number.isFinite(plan.maxPlannedAltitudeM) ? [{ key: 'altitude', label: t.map.altitude, children: formatNumber(plan.maxPlannedAltitudeM, ' m') }] : []),
        ...(plan?.plannedDurationSec != null && Number.isFinite(plan.plannedDurationSec) ? [{ key: 'duration', label: t.kpi.plannedDuration, children: formatDuration(plan.plannedDurationSec) }] : []),
        ...(plan?.waypoints?.length ? [{ key: 'waypoints', label: t.map.waypoint, children: plan.waypoints.length }] : []),
      ]} />
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
      <MissionCrewCard staff={(mission.staffAssignments ?? []).filter(a => a.isCurrent !== false)} deviceCode={null} deviceLabel={t.notRecorded}
        deviceAssignments={(mission.deviceAssignments ?? [])}
        missionId={mission.id} canReplaceStaff={canReplace}
        onReplaceDevice={canReplace ? assignment => setTarget({ kind: 'DEVICE', id: assignment.id, name: assignment.deviceName || assignment.deviceCode || assignment.deviceId }) : undefined} />
      {target && <MissionResourceReplacementDialog key={`${target.kind}:${target.id}`} mission={mission} target={target} onClose={() => setTarget(null)} onSaved={onUpdated} />}
    </section>
  )
}
