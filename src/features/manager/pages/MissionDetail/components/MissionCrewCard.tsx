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

/** A compact mission context row that keeps secondary operational detail available. */
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
  const scheduledStart =
    rows.find((row) => row.label === t.fields.scheduledStart)?.value ?? '—'
  const scheduledEnd =
    rows.find((row) => row.label === t.fields.scheduledEnd)?.value ?? '—'

  return (
    <details className="mgr-md-context">
      <summary className="mgr-md-context-summary">
        <span className="mgr-md-context-title">{t.contextCard}</span>
        <span className="mgr-md-context-meta">
          <span>
            {t.fields.schedule}: {scheduledStart} – {scheduledEnd}
          </span>
          <span>{deviceLabel}</span>
          {staff.length > 0 ? (
            <span>{t.crewAccepted(accepted, staff.length)}</span>
          ) : null}
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
        </span>
        <span className="mgr-md-context-chevron" aria-hidden="true" />
      </summary>

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
    </details>
  )
}
