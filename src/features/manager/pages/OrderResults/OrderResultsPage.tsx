import {
  ArrowLeftOutlined,
  FileSearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Button, Skeleton, Tag } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { getMissionStatusLabel } from '../../../../shared/lib/statusTone'
import { displayOrderCode } from '../../../../shared/lib/orderCode'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { financeApi } from '../../../finance/api'
import { missionsApi } from '../../api/missionsApi'
import { ordersApi } from '../../api/ordersApi'
import { planningApi } from '../../api/planningApi'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import {
  formatDateTime,
  formatDuration,
} from '../../components/common/missionDetailHelpers'
import { managerHref } from '../../routes'
import { orderResultsPageMessages } from './OrderResultsPage.messages'
import './orderResultsPage.css'

function getSummarySections(
  summary: string,
  lang: string,
  missionCode: string,
) {
  const sectionLabels = [
    {
      prefix: 'Checklist công trình:',
      vi: 'Checklist công trình',
      en: 'Work checklist',
    },
    {
      prefix: 'Work acceptance checklist:',
      vi: 'Checklist công trình',
      en: 'Work checklist',
    },
    {
      prefix: 'Kiểm tra trước bay:',
      vi: 'Kiểm tra trước bay',
      en: 'Preflight check',
    },
    { prefix: 'Precheck:', vi: 'Kiểm tra trước bay', en: 'Preflight check' },
    { prefix: 'Thời tiết:', vi: 'Thời tiết', en: 'Weather' },
    { prefix: 'Weather:', vi: 'Thời tiết', en: 'Weather' },
    {
      prefix: 'Kiểm tra sau bay:',
      vi: 'Kiểm tra sau bay',
      en: 'Postflight check',
    },
    { prefix: 'Postcheck:', vi: 'Kiểm tra sau bay', en: 'Postflight check' },
  ]
  const escapedPrefixes = sectionLabels.map(({ prefix }) =>
    prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  )
  const sectionPattern = new RegExp(`(?=${escapedPrefixes.join('|')})`, 'g')

  return summary
    .split(sectionPattern)
    .map((part, index) => {
      const text = part.trim().replace(/^[.·]\s*/, '')
      const section = sectionLabels.find(({ prefix }) =>
        text.startsWith(prefix),
      )
      if (!section) {
        let value = text
          .replace(missionCode, '')
          .replace(/^\s*[·|—-]\s*/, '')
          .trim()
        value = value.replace(
          /^Giám sát công trình:/,
          lang === 'vi' ? 'Giám sát công trình:' : 'Construction monitoring:',
        )
        return {
          label: lang === 'vi' ? 'Thông tin nhiệm vụ' : 'Mission details',
          value,
          key: `overview-${index}`,
        }
      }

      const value = text.slice(section.prefix.length).trim()
      const isWeather =
        section.prefix === 'Thời tiết:' || section.prefix === 'Weather:'
      return {
        label: lang === 'vi' ? section.vi : section.en,
        value: isWeather
          ? formatWeatherSummary(value, lang)
          : formatSummaryValue(section.vi, value, lang),
        key: section.vi,
      }
    })
    .filter((section) => section.value.length > 0)
}

function formatSummaryValue(label: string, rawValue: string, lang: string) {
  const value = rawValue
    .replace(/\s*[·.]\s*Media:\s*\d+\s*(?:tệp|files?|file\(s\))\.?/gi, '')
    .trim()
  const counts = value.match(/(\d+)\s*\/\s*(\d+)/)
  if (!counts) return value

  const [, passed, total] = counts
  if (label === 'Checklist công trình') {
    return lang === 'vi'
      ? `${passed}/${total} mục công việc được nghiệm thu.`
      : `${passed}/${total} work items accepted.`
  }

  return lang === 'vi'
    ? `${passed}/${total} mục đạt.`
    : `${passed}/${total} checks passed.`
}

function getMediaBreakdown(
  mediaFiles: { type: string; contentType: string }[] | null,
) {
  if (!mediaFiles) return null
  return mediaFiles.reduce(
    (counts, media) => {
      const type = `${media.type} ${media.contentType}`.toUpperCase()
      if (type.includes('VIDEO')) counts.videos += 1
      else if (type.includes('IMAGE') || type.includes('PHOTO'))
        counts.photos += 1
      else counts.other += 1
      return counts
    },
    { photos: 0, videos: 0, other: 0 },
  )
}

function formatWeatherSummary(value: string, lang: string) {
  const status = value.split(/[,.]/, 1)[0].trim().toUpperCase()
  if (['PASS', 'SAFE', 'SUITABLE', 'AVAILABLE'].includes(status)) {
    return lang === 'vi' ? 'Đạt điều kiện bay' : 'Flight conditions met'
  }
  if (['FAIL', 'UNSAFE', 'UNSUITABLE', 'NO_GO'].includes(status)) {
    return lang === 'vi'
      ? 'Không đạt điều kiện bay'
      : 'Flight conditions not met'
  }
  if (status.includes('CHƯA CÓ DỮ LIỆU') || status === 'NO DATA') {
    return lang === 'vi'
      ? 'Chưa có dữ liệu thời tiết'
      : 'Weather data unavailable'
  }
  return lang === 'vi'
    ? 'Đã kiểm tra điều kiện thời tiết'
    : 'Weather conditions checked'
}

export function OrderResultsPage({ orderId }: { orderId: string }) {
  const { t, locale, lang } = useI18n(orderResultsPageMessages)
  const query = useApiQuery(
    async (signal) => {
      const [order, missions, pricing] = await Promise.all([
        ordersApi.getOrder(orderId, signal),
        planningApi.getOrderMissions(orderId, signal),
        financeApi.getPricingReview(orderId, signal).catch(() => null),
      ])
      const results = await Promise.all(
        missions.map(async (mission) => {
          const [result, assignmentSelection] = await Promise.all([
            missionsApi.getMissionResult(mission.id, signal).catch(() => null),
            planningApi.getAssignments(mission.id, signal).catch(() => null),
          ])
          const assignedItemIds = new Set(
            (assignmentSelection?.assignments ?? [])
              .filter((assignment) => assignment.active)
              .map((assignment) => assignment.orderChecklistItemId),
          )
          const acceptedQuote = pricing?.quoteHistory
            .filter((quote) => quote.status === 'ACCEPTED_BY_CUSTOMER')
            .sort((left, right) => right.version - left.version)[0]
          const missionPrice =
            (acceptedQuote ?? pricing?.currentQuote)?.items
              .filter(
                (item) =>
                  item.orderChecklistItemId &&
                  assignedItemIds.has(item.orderChecklistItemId),
              )
              .reduce((total, item) => total + item.amount, 0) ?? null
          return { mission, result, missionPrice }
        }),
      )
      return { order, results }
    },
    [orderId],
  )

  const backLink = (
    <a className="mgr-back-link" href={managerHref({ screen: 'orderQueue' })}>
      <ArrowLeftOutlined aria-hidden="true" /> {t.back}
    </a>
  )

  if (query.loading && !query.data) {
    return (
      <div className="mgr-view mgr-order-results">
        {backLink}
        <CardComponent>
          <Skeleton active paragraph={{ rows: 6 }} />
        </CardComponent>
      </div>
    )
  }
  if (query.error || !query.data) {
    return (
      <div className="mgr-view mgr-order-results">
        {backLink}
        <ErrorState
          title={t.loadError}
          action={
            <Button icon={<ReloadOutlined />} onClick={query.reload}>
              {t.retry}
            </Button>
          }
        />
      </div>
    )
  }

  const { order, results } = query.data
  const recorded = results.filter(({ result }) => result !== null).length
  const orderCode = displayOrderCode(order.code, order.id)

  return (
    <div className="mgr-view mgr-order-results">
      {backLink}
      <header className="mgr-order-results__header">
        <div>
          <h1>{t.eyebrow}</h1>
          <p className="mgr-order-results__code">{orderCode}</p>
        </div>
        <div className="mgr-order-results__stats">
          <span>{t.missionCount(results.length)}</span>
          <span>{t.resultCount(recorded)}</span>
        </div>
      </header>

      {results.length === 0 ? (
        <CardComponent>
          <EmptyState
            icon={<FileSearchOutlined />}
            title={t.emptyTitle}
            description={t.emptyDescription}
          />
        </CardComponent>
      ) : (
        <div className="mgr-order-results__list">
          {results.map(({ mission, result, missionPrice }) => {
            const mediaBreakdown = result
              ? getMediaBreakdown(result.mediaFiles)
              : null
            return (
              <CardComponent key={mission.id} className="mgr-order-result-card">
                <article className="mgr-order-result">
                  <header>
                    <div className="mgr-order-result__identity">
                      <h2>{mission.missionCode}</h2>
                      <span>{getMissionStatusLabel(mission.status, lang)}</span>
                    </div>
                    <div className="mgr-order-result__actions">
                      {result && (
                        <Tag
                          color={
                            result.approvalStatus === 'APPROVED'
                              ? 'success'
                              : result.approvalStatus === 'REJECTED'
                                ? 'error'
                                : 'warning'
                          }
                        >
                          {t.approval[result.approvalStatus]}
                        </Tag>
                      )}
                      <Button
                        type="primary"
                        href={managerHref({
                          screen: 'missionDetail',
                          missionId: mission.id,
                        })}
                      >
                        {t.viewMission}
                      </Button>
                    </div>
                  </header>
                  {result ? (
                    <div className="mgr-order-result__body">
                      <dl className="mgr-order-result__facts">
                        <div>
                          <dt>{t.submittedAt}</dt>
                          <dd>
                            {result.submittedAt
                              ? formatDateTime(result.submittedAt, locale)
                              : t.notRecorded}
                          </dd>
                        </div>
                        <div>
                          <dt>{t.duration}</dt>
                          <dd>
                            {result.durationSeconds == null
                              ? t.notRecorded
                              : formatDuration(result.durationSeconds)}
                          </dd>
                          <span className="mgr-order-result__fact-hint">
                            {t.durationHint}
                          </span>
                        </div>
                        <div className="mgr-order-result__fact--price">
                          <dt>{t.missionPrice}</dt>
                          <dd>
                            {missionPrice == null
                              ? t.notRecorded
                              : formatVnd(missionPrice)}
                          </dd>
                          <span className="mgr-order-result__fact-hint">
                            {t.missionPriceHint}
                          </span>
                        </div>
                      </dl>
                      <section className="mgr-order-result__summary">
                        <h3>{t.summary}</h3>
                        {result.summary ? (
                          <dl className="mgr-order-result__summary-list">
                            {getSummarySections(
                              result.summary,
                              lang,
                              mission.missionCode,
                            ).map((section) => (
                              <div key={section.key}>
                                <dt>{section.label}</dt>
                                <dd>{section.value}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : (
                          <p>{result.notes || t.notRecorded}</p>
                        )}
                      </section>
                      <section className="mgr-order-result__media">
                        <h3>{t.media}</h3>
                        {mediaBreakdown ? (
                          <dl>
                            <div>
                              <dt>{t.photos}</dt>
                              <dd>{mediaBreakdown.photos}</dd>
                            </div>
                            <div>
                              <dt>{t.videos}</dt>
                              <dd>{mediaBreakdown.videos}</dd>
                            </div>
                            {mediaBreakdown.other > 0 && (
                              <div>
                                <dt>{t.otherFiles}</dt>
                                <dd>{mediaBreakdown.other}</dd>
                              </div>
                            )}
                          </dl>
                        ) : (
                          <p>
                            {result.mediaCount === 0
                              ? t.noMedia
                              : t.mediaBreakdownUnavailable}
                          </p>
                        )}
                      </section>
                    </div>
                  ) : (
                    <p className="mgr-order-result__empty">{t.noResult}</p>
                  )}
                </article>
              </CardComponent>
            )
          })}
        </div>
      )}
    </div>
  )
}
