import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import { getMissionStatusMeta } from '../../lib/orderStatus'
import { customerMissionReportApi } from '../../api/customerMissionReportApi'
import { customerHref } from '../../routes'
import { CustomerMissionMediaGallery } from './CustomerMissionMediaGallery'
import { customerReportMessages } from './messages'
import './reports.css'

export function CustomerMissionReportPage({
  orderId,
  missionId,
}: {
  orderId: string
  missionId: string
}) {
  return (
    <CustomerMissionReportContent
      key={`${orderId}:${missionId}`}
      orderId={orderId}
      missionId={missionId}
    />
  )
}

export function CustomerMissionReportContent({
  orderId,
  missionId,
  showMedia = true,
}: {
  orderId: string
  missionId: string
  showMedia?: boolean
}) {
  const { t, locale } = useI18n(customerReportMessages)
  const query = useApiQuery(
    (signal) => customerMissionReportApi.report(orderId, missionId, signal),
    [orderId, missionId],
  )
  // No report/checklist publication inference from Mission lifecycle or Order status.
  const report = query.error || query.loading ? undefined : query.data
  const siblings = useApiQuery(
    (signal) =>
      report
        ? customerMissionReportApi.list(orderId, signal)
        : Promise.resolve([]),
    [orderId, Boolean(report)],
  )
  const published = report?.reportAvailable === true && Boolean(report.result)
  const status = report
    ? getMissionStatusMeta(
        report.mission.status,
        locale === 'en-US' ? 'en' : 'vi',
      )
    : null
  const formatPeriod = (start: string | null, end: string | null) => {
    if (!start || Number.isNaN(Date.parse(start))) return t.unscheduled
    const first = new Date(start)
    const last = end && !Number.isNaN(Date.parse(end)) ? new Date(end) : null
    const date = (value: Date) =>
      value.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    const time = (value: Date) =>
      value.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    return `${date(first)} · ${time(first)}${last ? (date(first) === date(last) ? `–${time(last)}` : ` → ${date(last)} · ${time(last)}`) : ''}`
  }
  return (
    <div className="cr-report">
      <a
        className="cr-back"
        href={customerHref({ screen: 'orderDetail', orderId })}
      >
        <span aria-hidden="true">← </span>
        {t.back}
      </a>
      <header className="cr-heading cr-report-header">
        <div>
          <h1>{t.report}</h1>
          {report && (
            <div className="cr-report-identity">
              <span className="odm-mono">{report.mission.missionCode}</span>
              {status && (
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              )}
              {report.mission.scopeLabel && (
                <span>{report.mission.scopeLabel}</span>
              )}
            </div>
          )}
        </div>
        <button
          className="odm-btn odm-btn-gh"
          disabled={query.loading}
          onClick={query.reload}
        >
          {t.refresh}
        </button>
      </header>
      {query.loading && <p role="status">{t.loading}</p>}
      {query.error ? <p role="alert">{t.error}</p> : null}
      {report && (
        <>
          <section className="cr-section cr-overview" aria-label={t.overview}>
            <h2>{t.overview}</h2>
            <dl className="cr-summary-grid">
              <div>
                <dt>{t.scope}</dt>
                <dd>{report.mission.scopeLabel || '—'}</dd>
              </div>
              <div>
                <dt>{t.schedule}</dt>
                <dd>
                  {formatPeriod(
                    report.mission.scheduledStartAt,
                    report.mission.scheduledEndAt,
                  )}
                </dd>
              </div>
              <div>
                <dt>{t.publicationStatus}</dt>
                <dd>{published ? t.publishedLabel : t.unpublishedLabel}</dd>
              </div>
              {published && report.result && (
                <>
                  <div>
                    <dt>{t.actualPeriod}</dt>
                    <dd>
                      {formatPeriod(
                        report.result.startedAt,
                        report.result.endedAt,
                      )}
                    </dd>
                  </div>
                  {report.result.durationSeconds != null && (
                    <div>
                      <dt>{t.duration}</dt>
                      <dd>
                        {t.minutes(
                          Math.ceil(report.result.durationSeconds / 60),
                        )}
                      </dd>
                    </div>
                  )}
                </>
              )}
            </dl>
            {!siblings.error &&
              siblings.data
                ?.filter(
                  (m) =>
                    m.missionId === report.mission.replacesMissionId ||
                    m.replacesMissionId === missionId,
                )
                .map((m) => (
                  <p className="cr-note" key={m.missionId}>
                    {m.missionId === report.mission.replacesMissionId
                      ? t.replaces
                      : t.replacedBy}{' '}
                    <a
                      href={customerHref({
                        screen: 'missionReport',
                        orderId,
                        missionId: m.missionId,
                      })}
                    >
                      {m.missionCode}
                    </a>
                  </p>
                ))}
          </section>
          <section
            className={`cr-publication ${published ? 'is-published' : ''}`}
            role="status"
          >
            <span className="cr-publication-icon" aria-hidden="true">
              {published ? '✓' : '◷'}
            </span>
            <div>
              <h2>
                {published ? t.publicationPublished : t.publicationPending}
              </h2>
              <p>
                {published
                  ? t.publicationPublishedNote
                  : t.publicationPendingNote}
              </p>
            </div>
          </section>
          {published && report.result ? (
            <>
              <section className="cr-section">
                <h2>{t.monitoringResult}</h2>
                <p className="cr-copy">
                  {report.result.summary || t.noSummary}
                </p>
              </section>
              <section className="cr-section" aria-label={t.checklist}>
                <h2>{t.checklist}</h2>
                {report.checklistItems.length === 0 ? (
                  <p>{t.emptyChecklist}</p>
                ) : (
                  <ol className="cr-checklist">
                    {[...report.checklistItems]
                      .sort(
                        (a, b) =>
                          a.displayOrder - b.displayOrder ||
                          a.executionId.localeCompare(b.executionId),
                      )
                      .map((item) => (
                        <li key={item.executionId}>
                          <div className="cr-checklist-title">
                            <span
                              aria-hidden="true"
                              className={`cr-check-icon ${item.status === 'UNABLE_TO_VERIFY' ? 'is-unverified' : ''}`}
                            >
                              {item.status === 'COMPLETED' ? '✓' : '—'}
                            </span>
                            <h3>{item.content}</h3>
                          </div>
                          <dl className="cr-checklist-meta">
                            <div>
                              <dt>{t.executionLabel}</dt>
                              <dd>{t.execution[item.status] || t.unknown}</dd>
                            </div>
                            <div>
                              <dt>{t.assessmentLabel}</dt>
                              <dd>
                                {t.assessment[item.assessment] || t.unknown}
                              </dd>
                            </div>
                          </dl>
                          {item.observation && (
                            <p className="cr-copy">{item.observation}</p>
                          )}
                          {item.status === 'UNABLE_TO_VERIFY' &&
                            item.unableToVerifyReason && (
                              <p className="cr-copy">
                                {item.unableToVerifyReason}
                              </p>
                            )}
                        </li>
                      ))}
                  </ol>
                )}
              </section>
            </>
          ) : null}
          {showMedia && (
            <CustomerMissionMediaGallery
              key={missionId}
              missionId={missionId}
              missionCode={report.mission.missionCode}
            />
          )}
        </>
      )}
    </div>
  )
}
