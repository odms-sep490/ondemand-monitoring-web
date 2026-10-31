import { OrderIcon } from '../../../components/common/OrderIcon'
import {
  initialsOf,
  groupStaffAssignments,
  STAFF_ROLE_LABELS,
  assignmentTone,
  STAFF_RESPONSE_LABELS,
} from '../../../components/common/missionDetailHelpers'
import { flightPermitCardMessages } from '../../../components/common/FlightPermitCard.messages'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import {
  Card,
  EmptyState,
  StatusBadge,
} from '../../../../../shared/components/ui'
import type { ReactNode } from 'react'
import type {
  FlightPermitStatus,
  MissionStaffAssignmentResponse,
} from '../../../types/missions'

/** Sticky sidebar: mission info, crew & device, flight permit and the delivery panel. */
export function MissionCrewCard({
  rows,
  note,
  staff,
  deviceCode,
  deviceLabel,
  permitStatus,
  permitNote,
  children,
}: {
  rows: { label: string; value: string }[]
  note: string | null
  staff: MissionStaffAssignmentResponse[]
  deviceCode: string | null
  deviceLabel: string
  permitStatus: FlightPermitStatus
  permitNote?: string | null
  /** Extra sidebar cards, e.g. the customer delivery panel. */
  children?: ReactNode
}) {
  const { t } = useI18n(missionDetailPageMessages)
  const { t: permit } = useI18n(flightPermitCardMessages)
  const staffGroups = groupStaffAssignments(staff)
  const accepted = staffGroups.filter(
    (group) => group.responseStatus === 'ACCEPTED',
  ).length
  return (
    <aside className="mgr-detail-side">
      <Card title={t.infoCard}>
        <dl className="mgr-kv">
          {rows.map((row) => (
            <div className="mgr-kv-row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        {note ? <p className="odm-or-detail-note">{note}</p> : null}
      </Card>

      <Card
        title={t.crewCard}
        actions={
          staffGroups.length > 0 ? (
            <span className="odm-or-crew-count">
              {t.crewAccepted(accepted, staffGroups.length)}
            </span>
          ) : undefined
        }
      >
        {staffGroups.length > 0 ? (
          <progress
            className="mgr-plan-progress"
            max={staffGroups.length}
            value={accepted}
            aria-hidden="true"
          />
        ) : null}
        {deviceCode || staffGroups.length > 0 ? (
          <ul className="odm-or-crew-list">
            {deviceCode ? (
              <li className="odm-or-crew-item">
                <span className="odm-or-crew-avatar is-device">
                  <OrderIcon name="drone" size={16} />
                </span>
                <span className="odm-or-crew-main">
                  <span className="odm-or-crew-role">{t.crewDevice}</span>
                  <strong>{deviceLabel}</strong>
                </span>
              </li>
            ) : null}
            {staffGroups.map((group) => {
              const name =
                group.staffName ??
                group.staffEmail ??
                group.staffId
              return (
                <li key={group.staffId} className="odm-or-crew-item">
                  <span className="odm-or-crew-avatar" aria-hidden="true">
                    {initialsOf(name)}
                  </span>
                  <span className="odm-or-crew-main">
                    <strong>{name}</strong>
                    {group.staffEmail && group.staffName ? (
                      <small>{group.staffEmail}</small>
                    ) : null}
                    <span className="odm-or-crew-roles">
                      {group.assignments.map((assignment) => (
                        <span key={assignment.id}>
                          {STAFF_ROLE_LABELS[assignment.assignedRole]}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span
                    className={`odm-or-pill odm-or-pill-${assignmentTone(
                      group.responseStatus,
                    )}`}
                  >
                    {STAFF_RESPONSE_LABELS[group.responseStatus]}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState title={t.crewEmpty} />
        )}
      </Card>

      <Card title={t.permitCard}>
        <dl className="mgr-kv">
          <div className="mgr-kv-row">
            <dt>{t.permitCard}</dt>
            <dd>
              <StatusBadge
                tone={permitStatus === 'APPROVED' ? 'success' : 'warning'}
              >
                {permit.statuses[permitStatus]}
              </StatusBadge>
            </dd>
          </div>
        </dl>
        {permitNote ? <p className="odm-or-detail-note">{permitNote}</p> : null}
      </Card>

      {children}
    </aside>
  )
}
