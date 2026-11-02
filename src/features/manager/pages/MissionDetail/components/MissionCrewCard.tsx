import { OrderIcon } from '../../../components/common/OrderIcon'
import {
  initialsOf,
  STAFF_ROLE_LABELS,
  assignmentTone,
  STAFF_RESPONSE_LABELS,
} from '../../../components/common/missionDetailHelpers'
import { flightPermitCardMessages } from '../../../components/common/FlightPermitCard.messages'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import {
  EmptyState,
  StatusBadge,
} from '../../../../../shared/components/ui'
import type {
  FlightPermitStatus,
  MissionStaffAssignmentResponse,
} from '../../../types/missions'

/** Mission and assigned-resource details shown in their own detail tab. */
export function MissionCrewCard({
  rows,
  note,
  staff,
  accepted,
  deviceCode,
  deviceLabel,
  permitStatus,
  permitNote,
}: {
  rows: { label: string; value: string }[]
  note: string | null
  staff: MissionStaffAssignmentResponse[]
  accepted: number
  deviceCode: string | null
  deviceLabel: string
  permitStatus: FlightPermitStatus
  permitNote?: string | null
}) {
  const { t } = useI18n(missionDetailPageMessages)
  const { t: permit } = useI18n(flightPermitCardMessages)

  return (
    <section className="odm-or-card mgr-md-context" aria-label={t.contextCard}>
      <header className="mgr-md-context-heading">
        <h2 className="mgr-md-context-title">{t.contextCard}</h2>
      </header>
      <div className="mgr-md-context-body">
        <section className="mgr-md-context-section mgr-md-context-info">
          <h2>{t.infoCard}</h2>
          <dl className="mgr-md-context-kv">
            {rows.map((row) => (
              <div className="mgr-kv-row" key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          {note ? (
            <p className="mgr-md-context-note">
              <strong>{t.notes}:</strong> {note}
            </p>
          ) : null}
        </section>

        <div className="mgr-md-context-support">
          <section className="mgr-md-context-section">
            <div className="mgr-md-context-section-head">
              <h2>{t.crewCard}</h2>
              {staff.length > 0 ? (
                <span className="odm-or-crew-count">
                  {t.crewAccepted(accepted, staff.length)}
                </span>
              ) : null}
            </div>
            {staff.length > 0 ? (
              <progress
                className="mgr-plan-progress"
                max={staff.length}
                value={accepted}
                aria-label={t.crewAccepted(accepted, staff.length)}
              />
            ) : null}
            {deviceCode || staff.length > 0 ? (
              <ul className="odm-or-crew-list mgr-md-crew-list">
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
                {staff.map((assignment) => {
                  const name =
                    assignment.staffName ??
                    assignment.staffEmail ??
                    assignment.staffId
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
              <EmptyState title={t.crewEmpty} />
            )}
          </section>

          <section className="mgr-md-context-section mgr-md-permit">
            <div className="mgr-md-context-section-head">
              <h2>{t.permitCard}</h2>
              <StatusBadge
                tone={
                  permitStatus === 'APPROVED'
                    ? 'success'
                    : permitStatus === 'REJECTED'
                      ? 'danger'
                      : 'warning'
                }
              >
                {permit.statuses[permitStatus]}
              </StatusBadge>
            </div>
            {permitNote ? (
              <p className="mgr-md-context-note">{permitNote}</p>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  )
}
