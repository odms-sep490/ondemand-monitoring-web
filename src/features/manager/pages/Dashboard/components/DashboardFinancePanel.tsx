import { defineMessages, useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import { managerHref } from '../../../routes'
import type { DashboardFinance } from '../../../types/dashboard'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS_TICK, GRID_STROKE } from './charts/ChartTooltip'

const messages = defineMessages({
  vi: {
    title: 'Doanh thu & dòng tiền',
    scope: 'Theo kỳ đã chọn · chỉ tính giao dịch đã xác nhận',
    received: 'Tiền đã thu',
    refunded: 'Tiền đã hoàn',
    net: 'Thực thu sau hoàn tiền',
    chart: 'Dòng tiền theo thời gian',
    recent: 'Giao dịch gần đây',
    empty: 'Chưa có giao dịch trong kỳ này.',
    unavailable: 'Chưa có dữ liệu tài chính.',
    types: { DEPOSIT: 'Đặt cọc', MISSION_PAYMENT: 'Thanh toán nhiệm vụ', FINAL_PAYMENT: 'Thanh toán cuối', REFUND: 'Hoàn tiền' },
  },
  en: {
    title: 'Revenue & cash flow',
    scope: 'Selected period · confirmed transactions only',
    received: 'Payments received',
    refunded: 'Refunds paid',
    net: 'Net cash received',
    chart: 'Cash flow over time',
    recent: 'Recent transactions',
    empty: 'No transactions in this period.',
    unavailable: 'Financial data is unavailable.',
    types: { DEPOSIT: 'Deposit', MISSION_PAYMENT: 'Mission payment', FINAL_PAYMENT: 'Final payment', REFUND: 'Refund' },
  },
})

export function DashboardFinancePanel({ finance }: { finance?: DashboardFinance | null }) {
  const { t, locale } = useI18n(messages)
  const dates = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
  const timestamps = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' })
  const points = finance?.cashFlow ?? []
  const received = points.reduce((total, point) => total + point.received, 0)
  const refunded = points.reduce((total, point) => total + point.refunded, 0)
  const shortMoney = new Intl.NumberFormat(locale, { notation: 'compact' })
  const chartPoints = points.map((point) => ({ ...point, label: dates.format(new Date(point.date)) }))

  return (
    <section className="mgr-dash-finance" aria-label={t.title}>
      <header><h2>{t.title}</h2><p>{t.scope}</p></header>
      {!finance ? <p>{t.unavailable}</p> : (
        <>
          <dl className="mgr-dash-money">
            <div><dt>{t.net}</dt><dd>{formatVnd(received - refunded)}</dd></div>
            <div><dt>{t.received}</dt><dd>{formatVnd(received)}</dd></div>
            <div><dt>{t.refunded}</dt><dd>{formatVnd(refunded)}</dd></div>
          </dl>
          <div className="mgr-dash-finance-grid">
            <section>
              <h3>{t.chart}</h3>
              {points.length ? (
                <>
                  <p className="mgr-dash-legend"><span>{t.received}</span><span>{t.refunded}</span></p>
                  <div className="mgr-dash-cashflow">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartPoints} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
                        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 5" vertical={false} />
                        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={14} />
                        <YAxis width={55} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(value: number) => shortMoney.format(value)} />
                        <Tooltip formatter={(value) => formatVnd(Number(value))} />
                        <Bar dataKey="received" name={t.received} fill="var(--ant-color-primary, #1565e8)" radius={[5, 5, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                        <Bar dataKey="refunded" name={t.refunded} fill="var(--ant-color-warning, #f59e0b)" radius={[5, 5, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="odm-visually-hidden">
                    {chartPoints.map((point) => (
                      <li key={point.date}>
                        {point.label} · {t.received} {formatVnd(point.received)} · {t.refunded} {formatVnd(point.refunded)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : <p>{t.empty}</p>}
            </section>
            <section>
              <h3>{t.recent}</h3>
              {finance.recentTransactions.length ? (
                <ul className="mgr-dash-transactions">
                  {finance.recentTransactions.map((entry) => (
                    <li key={`${entry.type}:${entry.id}`}>
                      <div>
                        <strong>{t.types[entry.type]}</strong>
                        <a href={managerHref({ screen: 'orderReview', orderId: entry.orderId })}>
                          {displayOrderCode(entry.orderCode, entry.orderId)}
                        </a>
                      </div>
                      <div>
                        <strong>{entry.type === 'REFUND' ? '−' : '+'}{formatVnd(entry.amount)}</strong>
                        <time dateTime={entry.occurredAt}>{timestamps.format(new Date(entry.occurredAt))}</time>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p>{t.empty}</p>}
            </section>
          </div>
        </>
      )}
    </section>
  )
}
