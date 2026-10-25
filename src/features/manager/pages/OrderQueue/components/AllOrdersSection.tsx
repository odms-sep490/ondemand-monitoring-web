import { useI18n } from '../../../../../shared/i18n'
import { orderQueuePageMessages } from '../OrderQueuePage.messages'
import { useState } from 'react'
import { ALL_FILTERS } from '../queueHelpers'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { ordersApi } from '../../../api/ordersApi'
import { planningApi } from '../../../api/planningApi'
import type { OrderCreateResponse } from '../../../types/orders'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import { localizeTimeslot } from '../../../lib/viLabels'
import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import {
  orderStatusTone,
  orderStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { managerHref } from '../../../routes'

/** Every order, newest first, so an order never "disappears" once it leaves the review queue. */
export function AllOrdersSection() {
  const { t, locale } = useI18n(orderQueuePageMessages)
  const [filter, setFilter] = useState<(typeof ALL_FILTERS)[number]>('ALL')
  const query = useApiQuery(async (signal) => {
    const orders = await ordersApi.getManaged(undefined, signal)
    // An approved order stays APPROVED until its work is done; it is "in progress" once it has a live Mission.
    const started = new Set<string>()
    await Promise.all(
      orders
        .filter((order) => order.orderStatus === 'APPROVED')
        .map(async (order) => {
          try {
            const missions = await planningApi.getOrderMissions(
              order.id,
              signal,
            )
            if (missions.some((mission) => mission.status !== 'CANCELLED'))
              started.add(order.id)
          } catch {
            /* keep it under "Đã duyệt" */
          }
        }),
    )
    return { orders, started }
  }, [])
  const groupOf = (order: OrderCreateResponse) =>
    order.orderStatus === 'APPROVED' && query.data?.started.has(order.id)
      ? 'IN_PROGRESS'
      : order.orderStatus
  const rows = (query.data?.orders ?? []).filter((order) =>
    filter === 'ALL'
      ? true
      : filter === 'CLOSED'
        ? order.orderStatus === 'REJECTED' || order.orderStatus === 'CANCELLED'
        : groupOf(order) === filter,
  )
  return (
    <section className="odm-card odm-all-orders" aria-label={t.all.title}>
      <div className="odm-paid-orders-head">
        <div>
          <h2>{t.all.title}</h2>
          <p>{t.all.description}</p>
        </div>
      </div>
      <div className="odm-or-filters" role="group" aria-label={t.all.title}>
        {ALL_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            className={`odm-or-filter${filter === value ? ' is-active' : ''}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {t.all.filters[value]}
          </button>
        ))}
      </div>
      {query.error ? (
        <p role="alert">{t.all.loadError}</p>
      ) : query.loading ? (
        <p role="status">{t.loading}</p>
      ) : rows.length === 0 ? (
        <p className="odm-or-empty">{t.all.empty}</p>
      ) : (
        <div className="odm-mgr-queue-table-wrap">
          <table className="odm-table">
            <thead>
              <tr>
                <th>{t.columns.orderCode}</th>
                <th>{t.columns.customer}</th>
                <th>{t.columns.service}</th>
                <th>{t.columns.preferredDate}</th>
                <th>{t.all.status}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="odm-mono" style={{ fontWeight: 600 }}>
                      {displayOrderCode(row.orderCode, row.id)}
                    </span>
                  </td>
                  <td>{row.customerName}</td>
                  <td>{row.serviceName}</td>
                  <td>
                    <span className="odm-tn">
                      {new Date(row.preferredDateFrom).toLocaleDateString(
                        locale,
                      )}
                      {' · '}
                      {localizeTimeslot(row.preferredTimeName)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge
                      tone={toUiTone(
                        orderStatusTone[row.orderStatus] ?? 'gray',
                      )}
                    >
                      {groupOf(row) === 'IN_PROGRESS' &&
                      row.orderStatus === 'APPROVED'
                        ? t.all.filters.IN_PROGRESS
                        : (orderStatusLabel[row.orderStatus] ??
                          row.orderStatus)}
                    </StatusBadge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <a
                      className="odm-btn odm-btn-sm"
                      href={managerHref({
                        screen: 'orderReview',
                        orderId: row.id,
                      })}
                    >
                      {t.all.view}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
