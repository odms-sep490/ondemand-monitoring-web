import { ArrowLeftOutlined, FileSearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Skeleton, Tag } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
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
  const { t, locale } = useI18n(orderResultsPageMessages)
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
          <span className="mgr-order-results__eyebrow">{t.eyebrow}</span>
          <h1>{t.title(orderCode)}</h1>
          <p>{t.subtitle}</p>
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
            <CardComponent key={mission.id}>
              <article className="mgr-order-result">
                <header>
                  <div><h2>{mission.missionCode}</h2><span>{mission.status}</span></div>
                  {result && <Tag color={result.approvalStatus === 'APPROVED' ? 'success' : result.approvalStatus === 'REJECTED' ? 'error' : 'warning'}>{t.approval[result.approvalStatus]}</Tag>}
                </header>
                {result ? (
                  <>
                    <dl>
                      <div><dt>{t.submittedAt}</dt><dd>{result.submittedAt ? formatDateTime(result.submittedAt, locale) : t.notRecorded}</dd></div>
                      <div><dt>{t.duration}</dt><dd>{result.durationSeconds == null ? t.notRecorded : formatDuration(result.durationSeconds)}</dd></div>
                      <div><dt>{t.media}</dt><dd>{result.mediaCount ?? result.mediaFiles?.length ?? 0}</dd></div>
                    </dl>
                    {(result.summary || result.notes) && <section><h3>{t.summary}</h3><p>{result.summary || result.notes}</p></section>}
                  </>
                ) : <p className="mgr-order-result__empty">{t.noResult}</p>}
                <div className="mgr-order-result__action"><Button href={managerHref({ screen: 'missionDetail', missionId: mission.id })}>{t.viewMission}</Button></div>
              </article>
            </CardComponent>
          ))}
        </div>
      )}
    </div>
  )
}
