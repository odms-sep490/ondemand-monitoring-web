import { useEffect } from 'react'

import { StateView } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { displayOrderCode } from '../../../../shared/lib/orderCode'
import type { OrderCreateResponse } from '../../types/orders'
import { ordersApi } from '../../api/ordersApi'
import { localizeTimeslot } from '../../lib/viLabels'
import { managerHref } from '../../routes'
import { orderQueuePageMessages } from './OrderQueuePage.messages'
import { financeApi } from '../../../finance/api'
import { planningApi } from '../../api/planningApi'
import '../../manager.css'
import { QueueHeader } from './components/QueueHeader'
import { QueueSkeleton } from './components/QueueSkeleton'
import { AllOrdersSection } from './components/AllOrdersSection'

export function OrderQueuePage() {
  const { t, locale } = useI18n(orderQueuePageMessages)
  const query = useApiQuery(async (signal) => {
    const [pending, approved] = await Promise.all([
      ordersApi.getQueue(signal),
      ordersApi.getApproved(signal),
    ])
    const paid = (
      await Promise.all(
        approved.map(async (order) => {
          try {
            const [invoice, missions] = await Promise.all([
              financeApi.getManagerInvoice(order.id, signal),
              planningApi.getOrderMissions(order.id, signal),
            ])
            const hasActiveMission = missions.some(
              (mission) => mission.status !== 'CANCELLED',
            )
            return invoice.paidAmount >= invoice.depositAmount &&
              !hasActiveMission
              ? order
              : null
          } catch {
            return null
          }
        }),
      )
    ).filter((order): order is OrderCreateResponse => order !== null)
    return { pending, paid }
  }, [])

  useEffect(() => {
    const refresh = () => query.reload()
    window.addEventListener('focus', refresh)
    const interval = window.setInterval(refresh, 15_000)
    return () => {
      window.removeEventListener('focus', refresh)
      window.clearInterval(interval)
    }
  }, [query.reload])

  if (query.loading) return <QueueSkeleton />

  if (query.error) {
    return (
      <div className="odm-mgr-dash">
        <QueueHeader onRefresh={query.reload} t={t} />
        <StateView
          state="error"
          title={t.loadError}
          error={query.error}
          onRetry={query.reload}
        />
      </div>
    )
  }

  const data = query.data?.pending ?? []
  const paidOrders = query.data?.paid ?? []

  return (
    <div className="odm-mgr-dash">
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          <div className="odm-mgr-dash-date">
            {t.summary(data.length, paidOrders.length)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            className="odm-btn odm-btn-p"
            href={managerHref({ screen: 'missions' })}
            style={{ textDecoration: 'none' }}
          >
            {t.viewMissions}
          </a>
          <button type="button" className="odm-btn" onClick={query.reload}>
            {t.refresh}
          </button>
        </div>
      </div>

      {paidOrders.length > 0 ? (
        <section className="odm-card odm-paid-orders" aria-label={t.paid.title}>
          <div className="odm-paid-orders-head">
            <div>
              <h2>{t.paid.title}</h2>
              <p>{t.paid.description}</p>
            </div>
            <span>{t.paid.count(paidOrders.length)}</span>
          </div>
          <div className="odm-mgr-queue-table-wrap">
            <table className="odm-table">
              <thead>
                <tr>
                  <th>{t.columns.orderCode}</th>
                  <th>{t.columns.customer}</th>
                  <th>{t.columns.service}</th>
                  <th>{t.columns.preferredDate}</th>
                  <th>{t.paid.status}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {paidOrders.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="odm-mono" style={{ fontWeight: 600 }}>
                        {displayOrderCode(row.orderCode, row.id)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{row.customerName}</div>
                    </td>
                    <td>{row.serviceName}</td>
                    <td>
                      <span className="odm-tn">
                        {new Date(row.preferredDateFrom).toLocaleDateString(
                          locale,
                        )}{' '}
                        · {localizeTimeslot(row.preferredTimeName)}
                      </span>
                    </td>
                    <td>
                      <span className="odm-paid-badge">
                        {t.paid.depositReceived}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        className="odm-btn odm-btn-p odm-btn-sm"
                        href={managerHref({
                          screen: 'orderReview',
                          orderId: row.id,
                        })}
                      >
                        {t.paid.action}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {data.length === 0 && paidOrders.length === 0 ? (
        <StateView
          state="empty"
          title={t.emptyTitle}
          description={t.emptyDescription}
          action={
            <a
              className="odm-btn odm-btn-p"
              href={managerHref({ screen: 'missions' })}
              style={{ textDecoration: 'none' }}
            >
              {t.viewMissions}
            </a>
          }
        />
      ) : data.length > 0 ? (
        <div className="odm-card odm-mgr-queue-table-wrap">
          <table className="odm-table">
            <thead>
              <tr>
                <th>{t.columns.orderCode}</th>
                <th>{t.columns.customer}</th>
                <th>{t.columns.service}</th>
                <th>{t.columns.preferredDate}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((row: OrderCreateResponse) => (
                <tr key={row.id}>
                  <td>
                    <span className="odm-mono" style={{ fontWeight: 600 }}>
                      {displayOrderCode(row.orderCode, row.id)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.customerName}</div>
                  </td>
                  <td>{row.serviceName}</td>
                  <td>
                    <span className="odm-tn">
                      {new Date(row.preferredDateFrom).toLocaleDateString(
                        locale,
                      )}{' '}
                      · {localizeTimeslot(row.preferredTimeName)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <a
                      className="odm-btn odm-btn-p odm-btn-sm"
                      href={managerHref({
                        screen: 'orderReview',
                        orderId: row.id,
                      })}
                    >
                      {t.review}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <AllOrdersSection />
    </div>
  )
}
