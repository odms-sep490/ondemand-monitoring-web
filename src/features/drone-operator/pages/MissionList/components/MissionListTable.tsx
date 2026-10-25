import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { setActiveMissionId } from '../../../api/liveMission'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { formatDeadline } from '../../../lib/formatDeadline'
import { operatorHref } from '../../../routes'
import type { OperatorMission } from '../../../types/mission'
import { missionListTableMessages } from './MissionListTable.messages'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import {
  actionFor,
  weekdayDdMm,
  STATUS_TONE,
  MANAGER_SUBMISSION_TONE,
} from '../missionTableHelpers'

export function MissionListTable({
  missions,
  now,
  showSubmission = true,
}: {
  missions: OperatorMission[]
  now: Date
  /** The "sent to manager" column only matters once a Mission is finished. */
  showSubmission?: boolean
}) {
  const { t, lang, locale } = useI18n(missionListTableMessages)
  const today = now.toISOString().slice(0, 10)

  if (missions.length === 0) {
    return (
      <div
        className="odm-card"
        style={{ borderTop: 0, borderRadius: '0 0 8px 8px' }}
      >
        <div
          className="odm-card-body"
          style={{ padding: '48px 24px', textAlign: 'center' }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.emptyTitle}</div>
          <div style={{ color: 'var(--tx3)' }}>{t.emptyBody}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="odm-card"
      style={{ borderTop: 0, borderRadius: '0 0 8px 8px', overflowX: 'auto' }}
    >
      <table className="odm-table odm-opr-mission-table">
        <thead>
          <tr>
            <th className="odm-opr-mission-code">{t.columns.code}</th>
            <th className="odm-opr-mission-job">{t.columns.job}</th>
            <th className="odm-opr-mission-time">{t.columns.time}</th>
            <th className="odm-opr-mission-device">{t.columns.drone}</th>
            <th className="odm-opr-mission-status">{t.columns.status}</th>
            {showSubmission && (
              <th className="odm-opr-mission-manager">
                {t.columns.managerSubmission}
              </th>
            )}
            <th className="odm-opr-mission-deadline">{t.columns.deadline}</th>
            <th className="odm-opr-mission-action" />
          </tr>
        </thead>
        <tbody>
          {missions.map((mission) => {
            const baseAction = actionFor(mission, t)
            const action =
              mission.status === 'PENDING' &&
              baseAction.label === t.action.details
                ? { ...baseAction, label: 'Xem & phản hồi', cls: 'odm-btn-p' }
                : baseAction
            const deviceLabel = formatDeviceLabel(mission)
            return (
              <tr key={mission.id}>
                <td>
                  <a
                    className="odm-mono"
                    href={operatorHref({
                      screen: 'missionDetail',
                      missionId: mission.id,
                    })}
                    onClick={() => setActiveMissionId(mission.id)}
                    style={{
                      fontWeight: 600,
                      color: 'var(--blue)',
                      textDecoration: 'none',
                    }}
                  >
                    {mission.missionCode ?? mission.id}
                  </a>
                </td>
                <td className="odm-opr-mission-job">
                  <div className="odm-opr-mission-title">{mission.title}</div>
                  <div className="odm-opr-mission-location">
                    {mission.location}
                  </div>
                  {mission.serviceLabel ? (
                    <span className="odm-opr-chip">{mission.serviceLabel}</span>
                  ) : null}
                </td>
                <td>
                  <div className="odm-tn">
                    {weekdayDdMm(mission.date, today, t, locale)}
                  </div>
                  <div
                    className="odm-tn"
                    style={{ color: 'var(--tx3)', fontSize: 11.5 }}
                  >
                    {mission.startTime && mission.endTime
                      ? `${mission.startTime}–${mission.endTime}`
                      : '—'}
                  </div>
                </td>
                <td className="odm-opr-mission-device">
                  {deviceLabel ? (
                    deviceLabel
                  ) : (
                    <span style={{ color: 'var(--tx3)' }}>{t.unassigned}</span>
                  )}
                </td>
                <td>
                  <StatusBadge tone={STATUS_TONE[mission.status]}>
                    {missionStopLabel(mission) ??
                      (mission.backendStatus === 'PENDING_REVIEW'
                        ? lang === 'vi'
                          ? 'Chờ nghiệm thu'
                          : 'Awaiting review'
                        : ((t.statusLabel as Record<string, string>)[
                            mission.status
                          ] ??
                          mission.backendStatus ??
                          mission.status))}
                  </StatusBadge>
                </td>
                {showSubmission && (
                  <td>
                    {mission.status === 'COMPLETED' ||
                    mission.status === 'FAILED' ? (
                      <StatusBadge
                        tone={
                          MANAGER_SUBMISSION_TONE[
                            mission.managerSubmissionStatus ?? 'NEEDS_SUBMIT'
                          ]
                        }
                      >
                        {
                          t.managerSubmissionLabel[
                            mission.managerSubmissionStatus ?? 'NEEDS_SUBMIT'
                          ]
                        }
                      </StatusBadge>
                    ) : (
                      <span style={{ color: 'var(--tx3)' }}>—</span>
                    )}
                  </td>
                )}
                <td>
                  <span className="odm-tn" style={{ fontWeight: 500 }}>
                    {formatDeadline(mission, now, lang)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {action ? (
                    <a
                      className={`odm-btn odm-btn-sm ${action.cls}`}
                      href={action.href}
                      onClick={() => setActiveMissionId(mission.id)}
                    >
                      {action.label}
                    </a>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
