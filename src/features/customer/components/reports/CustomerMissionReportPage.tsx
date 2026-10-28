import { FileDoneOutlined, ProfileOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { ReloadOutlined } from '@ant-design/icons'
import { Button, Skeleton } from 'antd'

import { CardComponent, PageHeader, StatusTag } from '../../../../shared/components/antd'
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
    <div className="cus-page cr-report">
      {showMedia ? (
        <PageHeader
          crumb={
            <a className="cus-back" href={customerHref({ screen: 'orderDetail', orderId })}>
              <span aria-hidden="true">← </span>
              {t.back}
            </a>
          }
          title={t.report}
          description={
            report ? (
              <span className="cr-report-identity">
                <span className="odm-mono">{report.mission.missionCode}</span>
                {status && <StatusTag tone={status.tone}>{status.label}</StatusTag>}
                {report.mission.scopeLabel && <span>{report.mission.scopeLabel}</span>}
              </span>
            ) : undefined
          }
          actions={
            <Button icon={<ReloadOutlined aria-hidden="true" aria-label={undefined} />} disabled={query.loading} onClick={query.reload}>
              {t.refresh}
            </Button>
          }
        />
      ) : (
        <div className="cr-embedded-head">
          <h2 className="cr-embedded-title">{t.report}</h2>
          {report && (
            <span className="cr-report-identity">
              <span className="odm-mono">{report.mission.missionCode}</span>
              {status && <StatusTag tone={status.tone}>{status.label}</StatusTag>}
            </span>
          )}
          <Button
            className="cr-embedded-refresh"
            size="small"
            disabled={query.loading}
            onClick={query.reload}
          >
            {t.refresh}
          </Button>
        </div>
      )}
      {query.loading && (
        <CardComponent role="status">
          <Skeleton active paragraph={{ rows: 3 }} />
          <span className="odm-visually-hidden">{t.loading}</span>
        </CardComponent>
      )}
      {query.error ? (
        <CardComponent role="alert">{t.error}</CardComponent>
      ) : null}
      {report && (
        <>
          <CardComponent className="cr-overview" icon={<ProfileOutlined />} title={t.overview} role="region" aria-label={t.overview}>
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
          </CardComponent>
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
              <CardComponent icon={<FileDoneOutlined />} title={t.monitoringResult}>
                <p className="cr-copy">
                  {report.result.summary || t.noSummary}
                </p>
              </CardComponent>
              <CardComponent icon={<UnorderedListOutlined />} title={t.checklist} role="region" aria-label={t.checklist}>
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
              </CardComponent>
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
