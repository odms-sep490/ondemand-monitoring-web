import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import { formatDateRange } from '../../../lib/orders/format'
import type { OrderRow } from '../../../lib/orders/types'
import { useTimeslotLabel } from '../../../hooks/usePreferredTimes'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { customerHref } from '../../../routes'
import { ordersTableMessages } from './OrdersTable.messages'

const DASH = '—'

export function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const { t, locale, lang } = useI18n(ordersTableMessages)
  const timeLabel = useTimeslotLabel()
  const c = t.columns

  return (
    <table className="ord-table">
      <thead>
        <tr>
          <th className="ord-col-order">{c.order}</th>
          <th className="ord-col-location">{c.location}</th>
          <th>{c.schedule}</th>
          <th className="ord-col-service">{c.service}</th>
          <th>{c.status}</th>
          <th className="ord-col-actions">{c.actions}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const href = customerHref({ screen: 'orderDetail', orderId: row.id })
          return (
            <tr key={row.id}>
              <td className="ord-col-order">
                <a className="ord-title" href={href}>
                  {row.title}
                </a>
                <div className="ord-code">{row.code}</div>
              </td>
              <td className="ord-muted ord-col-location">
                {row.address ?? DASH}
              </td>
              <td className="ord-nowrap">
                {formatDateRange(row.dateFrom, row.dateTo, locale) ?? DASH}
                {row.timeName || row.timeId ? (
                  <div className="ord-muted">
                    {timeLabel({ id: row.timeId, name: row.timeName })}
                  </div>
                ) : null}
              </td>
              <td className="ord-col-service">
                {row.serviceName
                  ? localizeServiceName(
                      row.serviceId ?? row.serviceName,
                      lang,
                      row.serviceName,
                    )
                  : DASH}
              </td>
              <td>
                <div className="ord-status-stack">
                  <OrderStatusBadge status={row.status} />
                  {row.depositState === 'ACTION_REQUIRED' ? (
                    <span className="ord-payment-required">
                      <span aria-hidden="true" />
                      {t.paymentRequired}
                    </span>
                  ) : row.depositState === 'PAID' ? (
                    <span className="ord-deposit-paid">
                      <span aria-hidden="true" />
                      {t.depositPaid}
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="ord-col-actions">
                <a className="ord-view" href={href}>
                  {row.status === 'NEEDS_INFO' ? t.addInformation : t.view}
                  <Icon
                    name="arrow-right"
                    width={16}
                    height={16}
                    aria-hidden="true"
                  />
                </a>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
