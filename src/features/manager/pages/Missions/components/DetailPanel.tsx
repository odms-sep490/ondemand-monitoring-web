import { Alert, Button, Progress } from 'antd'
import { CloseOutlined, RightOutlined } from '@ant-design/icons'

import { CardComponent } from '../../../../../shared/components/antd'
import { formatOrderCode } from '../../../components/common/format'
import { MissionStatusTag } from '../../../components/common/MissionStatusTag'
import { OrderIcon } from '../../../components/common/OrderIcon'
import {
  initialsOf,
  STAFF_ROLE_LABELS,
  assignmentTone,
  STAFF_RESPONSE_LABELS,
} from '../../../components/common/missionDetailHelpers'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import { managerHref } from '../../../routes'
import type { MissionCalendarItem } from '../../../types/missions'
import { formatScheduled, formatStaffSummary } from '../missionsHelpers'
import type { PageMessages } from '../missionsTypes'

export type DetailPanelProps = {
  mission: MissionCalendarItem
  onClose: () => void
  t: PageMessages
  locale: 'vi-VN' | 'en-US'
}

function droneText(mission: MissionCalendarItem) {
  return mission.droneCode ? `${mission.droneCode}${mission.droneName ? ` ${mission.droneName}` : ''}` : '—'
}

export function DetailPanel({ mission, onClose, t, locale }: DetailPanelProps) {
  const rows: Array<{ label: string; value: string }> = []
  if (mission.orderCode) rows.push({ label: t.fields.order, value: formatOrderCode(mission.orderCode) })
  if (mission.serviceLabel) rows.push({ label: t.fields.service, value: mission.serviceLabel })
  rows.push({
    label: t.fields.schedule,
    value: formatScheduled(mission.scheduledStartAt, mission.scheduledEndAt, locale),
  })
  if (mission.droneCode) rows.push({ label: t.fields.drone, value: droneText(mission) })
  if (mission.operatorName) rows.push({ label: t.fields.operator, value: mission.operatorName })
  if (mission.addressText) rows.push({ label: t.fields.address, value: mission.addressText })
  const staffAssignments = mission.staffAssignments ?? []
  const hasAssignedResources = Boolean(mission.droneCode) || staffAssignments.length > 0
  const accepted = staffAssignments.filter((item) => item.responseStatus === 'ACCEPTED').length

  return (
    <aside className="mgr-detail-side mgr-missions-panel">
      <CardComponent
        title={<span className="mgr-card-title odm-mono">{mission.missionCode}</span>}
        extra={
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined aria-hidden="true" />}
            onClick={onClose}
            aria-label={t.close}
          />
        }
      >
        <div className="mgr-badge-row">
          <MissionStatusTag mission={mission} />
          {assignmentReadiness(mission).needsSetup ? (
            <Button
              type="primary"
              size="small"
              href={managerHref({ screen: 'missionSetup', missionId: mission.id })}
            >
              {t.dispatch}
            </Button>
          ) : null}
        </div>
        <dl className="mgr-kv">
          {rows.map((row) => (
            <div className="mgr-kv-row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardComponent>

      <CardComponent
        title={t.assignments.title}
        extra={
          staffAssignments.length > 0 ? (
            <span className="odm-or-crew-count">{formatStaffSummary(staffAssignments)}</span>
          ) : undefined
        }
      >
        {staffAssignments.length > 0 ? (
          <Progress
            percent={Math.round((accepted / staffAssignments.length) * 100)}
            showInfo={false}
            size="small"
            aria-hidden="true"
          />
        ) : null}
        {hasAssignedResources ? (
          <ul className="odm-or-crew-list">
            <li className="odm-or-crew-item">
              <span className="odm-or-crew-avatar is-device">
                <OrderIcon name="drone" size={16} />
              </span>
              <span className="odm-or-crew-main">
                <span className="odm-or-crew-role">{t.assignments.device}</span>
                <strong>{droneText(mission)}</strong>
              </span>
            </li>
            {staffAssignments.map((assignment) => {
              const name = assignment.staffName ?? assignment.staffEmail ?? t.assignedStaffFallback
              return (
                <li key={assignment.id} className="odm-or-crew-item">
                  <span className="odm-or-crew-avatar" aria-hidden="true">
                    {initialsOf(name)}
                  </span>
                  <span className="odm-or-crew-main">
                    <span className="odm-or-crew-role">{STAFF_ROLE_LABELS[assignment.assignedRole]}</span>
                    <strong>{name}</strong>
                    {assignment.staffEmail && assignment.staffName ? <small>{assignment.staffEmail}</small> : null}
                  </span>
                  <span className={`odm-or-pill odm-or-pill-${assignmentTone(assignment.responseStatus)}`}>
                    {STAFF_RESPONSE_LABELS[assignment.responseStatus]}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <Alert type="info" showIcon message={t.assignments.empty} />
        )}
      </CardComponent>

      <div className="mgr-actions">
        <Button type="primary" href={managerHref({ screen: 'missionDetail', missionId: mission.id })}>
          {t.viewDetail}
          <RightOutlined aria-hidden="true" />
        </Button>
        <Button href={managerHref({ screen: 'orderReview', orderId: mission.orderId })}>
          {t.openOrderPlan}
        </Button>
      </div>
    </aside>
  )
}
