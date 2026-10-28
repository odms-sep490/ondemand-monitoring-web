import { Button } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import type { CustomerMissionSummary } from '../../api/customerMissionReportApi'
import { fmtDate, fmtDateTime } from '../../lib/orderStatus'
import { customerHref } from '../../routes'
import { customerReportMessages } from './messages'

export function CustomerMissionCard({
  mission,
  siblings = [],
  showLink = true,
}: {
  mission: CustomerMissionSummary
  siblings?: CustomerMissionSummary[]
  showLink?: boolean
}) {
  const { t, locale } = useI18n(customerReportMessages)
  const state = mission.status
  const category =
    state === 'COMPLETED'
      ? 'completed'
      : state === 'CANCELLED'
        ? 'cancelled'
        : ['FAILED', 'FAILED_PREFLIGHT'].includes(state)
          ? 'failed'
          : [
                'PENDING_REVIEW',
                'PENDING_APPROVAL',
                'POSTFLIGHT_CHECKING',
              ].includes(state)
            ? 'review'
            : ['IN_FLIGHT', 'IN_PROGRESS', 'RETURNING'].includes(state)
              ? 'active'
              : state === 'SCHEDULED'
                ? 'scheduled'
                : 'waiting'
  const original = siblings.find(
    (m) => m.missionId === mission.replacesMissionId,
  )
  const replacements = siblings.filter(
    (m) => m.replacesMissionId === mission.missionId,
  )
  const link = (m: CustomerMissionSummary) =>
    customerHref({
      screen: 'missionReport',
      orderId: m.orderId,
      missionId: m.missionId,
    })
  return (
    <article className="cr-mission" aria-label={mission.missionCode}>
      <div className="cr-heading">
        <h3>{mission.missionCode}</h3>
        <span className={`cr-status cr-status--${category}`}>
          {t.statuses[category]}
        </span>
      </div>
      <dl className="cr-mission-facts">
        {mission.scopeLabel && (
          <div>
            <dt>{t.scope}</dt>
            <dd>{mission.scopeLabel}</dd>
          </div>
        )}
        <div>
          <dt>{t.schedule}</dt>
          <dd>{scheduleText(mission, locale, t.unscheduled)}</dd>
        </div>
      </dl>
      {original && (
        <p>
          {t.replaces} <a href={link(original)}>{original.missionCode}</a>.{' '}
          {t.independent}
        </p>
      )}
      {replacements.map((m) => (
        <p key={m.missionId}>
          {t.replacedBy} <a href={link(m)}>{m.missionCode}</a>
        </p>
      ))}
      {showLink && !mission.reportAvailable && (
        <p className="cr-mission-unavailable">{t.unavailable}</p>
      )}
      {showLink && (
        <Button
          className="cr-mission-link"
          type={mission.reportAvailable ? 'primary' : 'default'}
          href={link(mission)}
          aria-label={`${mission.reportAvailable ? t.view : t.details} ${mission.missionCode}`}
        >
          {mission.reportAvailable ? t.view : t.details}
        </Button>
      )}
    </article>
  )
}

/** `25/10/2026 07:04 → 08:04` when both ends fall on the same day, otherwise both full date-times. */
function scheduleText(
  mission: CustomerMissionSummary,
  locale: 'vi-VN' | 'en-US',
  fallback: string,
) {
  if (!mission.scheduledStartAt) return fallback
  const start = mission.scheduledStartAt
  const end = mission.scheduledEndAt
  if (!end) return fmtDateTime(start, locale)
  const sameDay = fmtDate(start, locale) === fmtDate(end, locale)
  return sameDay
    ? `${fmtDateTime(start, locale)} → ${new Date(end).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
    : `${fmtDateTime(start, locale)} → ${fmtDateTime(end, locale)}`
}
