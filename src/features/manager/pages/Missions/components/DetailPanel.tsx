import type { MissionCalendarItem } from '../../../types/missions'
import type { PageMessages } from '../missionsTypes'
import { formatOrderCode } from '../../../components/common/format'
import { formatScheduled, formatStaffSummary } from '../missionsHelpers'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import { managerHref } from '../../../routes'
import {
  initialsOf,
  STAFF_ROLE_LABELS,
  assignmentTone,
  STAFF_RESPONSE_LABELS,
} from '../../../components/common/missionDetailHelpers'

export type DetailPanelProps = {
  mission: MissionCalendarItem
  onClose: () => void
  t: PageMessages
  locale: 'vi-VN' | 'en-US'
}

export function DetailPanel({ mission, onClose, t, locale }: DetailPanelProps) {
  const rows: Array<{ label: string; value: string }> = []
  if (mission.orderCode)
    rows.push({
      label: t.fields.order,
      value: formatOrderCode(mission.orderCode),
    })
  if (mission.serviceLabel)
    rows.push({ label: t.fields.service, value: mission.serviceLabel })
  rows.push({
    label: t.fields.attempt,
    value: mission.attemptNumber == null ? '—' : `#${mission.attemptNumber}`,
  })
  rows.push({
    label: t.fields.schedule,
    value: formatScheduled(
      mission.scheduledStartAt,
      mission.scheduledEndAt,
      locale,
    ),
  })
  if (mission.droneCode)
    rows.push({
      label: t.fields.drone,
      value: `${mission.droneCode}${mission.droneName ? ` ${mission.droneName}` : ''}`,
    })
  if (mission.operatorName)
    rows.push({ label: t.fields.operator, value: mission.operatorName })
  if (mission.addressText)
    rows.push({ label: t.fields.address, value: mission.addressText })
  const staffAssignments = mission.staffAssignments ?? []
  const hasAssignedResources =
    Boolean(mission.droneCode) || staffAssignments.length > 0
  return (
    <aside className="odm-or-card odm-or-sidepanel">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title odm-mono">
          {mission.missionCode}
        </span>
        <button
          type="button"
          className="odm-or-icon-btn"
          onClick={onClose}
          aria-label={t.close}
        >
          <OrderIcon name="x" size={16} />
        </button>
      </header>
      <div className="odm-or-card-body" style={{ display: 'grid', gap: 14 }}>
        <div className="odm-or-panel-status">
          {missionStopLabel(mission) ? (
            <StatusBadge tone="yellow">{missionStopLabel(mission)}</StatusBadge>
          ) : (
            <StatusBadge
              kind="mission"
              status={mission.status}
              tone={missionStatusTone[mission.status]}
            />
          )}
          {assignmentReadiness(mission).needsSetup && (
            <a
              href={managerHref({
                screen: 'missionSetup',
                missionId: mission.id,
              })}
              className="odm-or-btn odm-or-btn-sm odm-or-btn-blue"
            >
              {t.dispatch}
            </a>
          )}
        </div>

        <dl className="odm-or-kv">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>

        <a
          className="odm-or-btn odm-or-btn-blue odm-or-view-btn"
          href={managerHref({ screen: 'missionDetail', missionId: mission.id })}
        >
          {t.viewDetail}
          <OrderIcon name="arrow-right" size={16} />
        </a>

        <section className="odm-or-crew">
          <div className="odm-or-crew-head">
            <span className="odm-or-crew-title">{t.assignments.title}</span>
            {staffAssignments.length > 0 ? (
              <span className="odm-or-crew-count">
                {formatStaffSummary(staffAssignments)}
              </span>
            ) : null}
          </div>
          {staffAssignments.length > 0 ? (
            <div className="odm-or-crew-progress" aria-hidden="true">
              <span
                style={{
                  width: `${
                    (staffAssignments.filter(
                      (i) => i.responseStatus === 'ACCEPTED',
                    ).length /
                      staffAssignments.length) *
                    100
                  }%`,
                }}
              />
            </div>
          ) : null}

          {hasAssignedResources ? (
            <ul className="odm-or-crew-list">
              <li className="odm-or-crew-item">
                <span className="odm-or-crew-avatar is-device">
                  <OrderIcon name="drone" size={16} />
                </span>
                <span className="odm-or-crew-main">
                  <span className="odm-or-crew-role">
                    {t.assignments.device}
                  </span>
                  <strong>
                    {mission.droneCode
                      ? `${mission.droneCode}${mission.droneName ? ` ${mission.droneName}` : ''}`
                      : '—'}
                  </strong>
                </span>
                {mission.droneCode ? (
                  <span className="odm-or-pill odm-or-pill-blue">
                    {t.assignments.reserved}
                  </span>
                ) : null}
              </li>

              {staffAssignments.map((assignment) => {
                const name =
                  assignment.staffName ??
                  assignment.staffEmail ??
                  'Nhân sự đã phân công'
                return (
                  <li key={assignment.id} className="odm-or-crew-item">
                    <span className="odm-or-crew-avatar" aria-hidden="true">
                      {initialsOf(name)}
                    </span>
                    <span className="odm-or-crew-main">
                      <span className="odm-or-crew-role">
                        {STAFF_ROLE_LABELS[assignment.assignedRole]}
                      </span>
                      <strong>{name}</strong>
                      {assignment.staffEmail && assignment.staffName ? (
                        <small>{assignment.staffEmail}</small>
                      ) : null}
                    </span>
                    <span
                      className={`odm-or-pill odm-or-pill-${assignmentTone(
                        assignment.responseStatus,
                      )}`}
                    >
                      {STAFF_RESPONSE_LABELS[assignment.responseStatus]}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="odm-or-empty">{t.assignments.empty}</div>
          )}
        </section>

        <a
          className="odm-or-btn odm-or-btn-blue"
          href={managerHref({
            screen: 'orderReview',
            orderId: mission.orderId,
          })}
        >
          Mở kế hoạch Order
        </a>
      </div>
    </aside>
  )
}
