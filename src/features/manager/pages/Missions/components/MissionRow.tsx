import { managerHref } from '../../../routes'
import { formatOrderCode } from '../../../components/common/format'
import {
  formatScheduled,
  formatStaffSummary,
  deliveryTone,
  deliveryLabel,
} from '../missionsHelpers'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import { missionsPageMessages } from '../MissionsPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionCalendarItem } from '../../../types/missions'
import type { Dispatch, SetStateAction } from 'react'
import type { DeliveryStatus } from '../missionsTypes'

export function MissionRow({
  selectedMission,
  m,
  setSelectedMission,
  deliveryStatuses,
  orderDeliveryStatuses,
}: {
  selectedMission: string | null
  m: MissionCalendarItem
  setSelectedMission: Dispatch<SetStateAction<string | null>>
  deliveryStatuses: Record<string, DeliveryStatus>
  orderDeliveryStatuses: Record<string, DeliveryStatus>
}) {
  const { t, locale } = useI18n(missionsPageMessages)
  return (
    <tr
      className={selectedMission === m.id ? 'is-selected' : undefined}
      onClick={() => setSelectedMission(selectedMission === m.id ? null : m.id)}
    >
      <td className="odm-or-table-strong odm-mono">{m.missionCode}</td>
      <td>
        <a
          href={managerHref({
            screen: 'orderReview',
            orderId: m.orderId,
          })}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Mở kế hoạch Order của ${m.missionCode}`}
        >
          {m.orderCode ? formatOrderCode(m.orderCode) : 'Mở kế hoạch Order'}
        </a>
      </td>
      <td>{m.attemptNumber == null ? '—' : `#${m.attemptNumber}`}</td>
      <td>{formatScheduled(m.scheduledStartAt, m.scheduledEndAt, locale)}</td>
      <td>
        {m.droneCode
          ? `${m.droneCode}${m.droneName ? ` ${m.droneName}` : ''}`
          : '—'}
      </td>
      <td>{formatStaffSummary(m.staffAssignments)}</td>
      <td>
        {missionStopLabel(m) ? (
          <StatusBadge tone="yellow">{missionStopLabel(m)}</StatusBadge>
        ) : (
          <StatusBadge
            kind="mission"
            status={m.status}
            tone={missionStatusTone[m.status]}
          />
        )}
        {assignmentReadiness(m).label && (
          <small className="odm-mission-meta">
            {assignmentReadiness(m).label}
          </small>
        )}
      </td>
      <td>
        <StatusBadge tone={deliveryTone(deliveryStatuses[m.id] ?? 'NOT_READY')}>
          {deliveryLabel(deliveryStatuses[m.id] ?? 'NOT_READY', t)}
        </StatusBadge>
        {orderDeliveryStatuses[m.orderId] && (
          <small className="odm-mission-meta">
            {deliveryLabel(orderDeliveryStatuses[m.orderId], t)}
          </small>
        )}
      </td>
      <td className="odm-or-table-action">
        <a
          className="odm-or-btn odm-or-btn-sm odm-or-btn-outline"
          href={managerHref({
            screen: 'missionDetail',
            missionId: m.id,
          })}
          onClick={(event) => event.stopPropagation()}
        >
          {t.view}
        </a>
        {assignmentReadiness(m).needsSetup && (
          <a
            className="odm-or-btn odm-or-btn-sm odm-or-btn-blue"
            href={managerHref({
              screen: 'missionSetup',
              missionId: m.id,
            })}
            onClick={(event) => event.stopPropagation()}
          >
            {t.continueSetup}
          </a>
        )}
      </td>
    </tr>
  )
}
