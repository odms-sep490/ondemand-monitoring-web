import { ArrowLeftOutlined, FileSearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Skeleton, Tag } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { getMissionStatusLabel } from '../../../../shared/lib/statusTone'
import { displayOrderCode } from '../../../../shared/lib/orderCode'
import { missionsApi } from '../../api/missionsApi'
import { ordersApi } from '../../api/ordersApi'
import { planningApi } from '../../api/planningApi'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { formatDateTime, formatDuration } from '../../components/common/missionDetailHelpers'
import { managerHref } from '../../routes'
import { orderResultsPageMessages } from './OrderResultsPage.messages'
import './orderResultsPage.css'

export function OrderResultsPage({ orderId }: { orderId: string }) {
  const { t, locale, lang } = useI18n(orderResultsPageMessages)
  const query = useApiQuery(async (signal) => {
    const [order, missions] = await Promise.all([
      ordersApi.getOrder(orderId, signal),
      planningApi.getOrderMissions(orderId, signal),
    ])
    const results = await Promise.all(
      missions.map(async (mission) => ({
        mission,
        result: await missionsApi.getMissionResult(mission.id, signal).catch(() => null),
      })),
    )
    return { order, results }
  }, [orderId])

  const backLink = (
    <a className="mgr-back-link" href={managerHref({ screen: 'orderQueue' })}>
      <ArrowLeftOutlined aria-hidden="true" /> {t.back}
    </a>
  )

  if (query.loading && !query.data) {
    return <div className="mgr-view mgr-order-results">{backLink}<CardComponent><Skeleton active paragraph={{ rows: 6 }} /></CardComponent></div>
  }
  if (query.error || !query.data) {
    return <div className="mgr-view mgr-order-results">{backLink}<ErrorState title={t.loadError} action={<Button icon={<ReloadOutlined />} onClick={query.reload}>{t.retry}</Button>} /></div>
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
        <CardComponent><EmptyState icon={<FileSearchOutlined />} title={t.emptyTitle} description={t.emptyDescription} /></CardComponent>
      ) : (
        <div className="mgr-order-results__list">
          {results.map(({ mission, result }) => (
            <CardComponent key={mission.id} className="mgr-order-result-card">
              <article className="mgr-order-result">
                <header>
                  <div className="mgr-order-result__identity"><h2>{mission.missionCode}</h2><span>{getMissionStatusLabel(mission.status, lang)}</span></div>
                  <div className="mgr-order-result__actions">
                  {result && <Tag color={result.approvalStatus === 'APPROVED' ? 'success' : result.approvalStatus === 'REJECTED' ? 'error' : 'warning'}>{t.approval[result.approvalStatus]}</Tag>}
                  <Button type="primary" href={managerHref({ screen: 'missionDetail', missionId: mission.id })}>{t.viewMission}</Button>
                  </div>
                </header>
                {result ? (
                  <div className="mgr-order-result__body">
                    <dl>
                      <div><dt>{t.submittedAt}</dt><dd>{result.submittedAt ? formatDateTime(result.submittedAt, locale) : t.notRecorded}</dd></div>
                      <div><dt>{t.duration}</dt><dd>{result.durationSeconds == null ? t.notRecorded : formatDuration(result.durationSeconds)}</dd></div>
                      <div><dt>{t.media}</dt><dd>{result.mediaCount ?? result.mediaFiles?.length ?? 0}</dd></div>
                    </dl>
                    <section className="mgr-order-result__summary"><h3>{t.summary}</h3><p>{result.summary || result.notes || t.notRecorded}</p></section>
                  </div>
                ) : <p className="mgr-order-result__empty">{t.noResult}</p>}
              </article>
            </CardComponent>
          ))}
        </div>
      )}
    </div>
  )
}
