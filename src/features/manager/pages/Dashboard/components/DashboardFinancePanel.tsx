import { useState } from 'react'
import { Select } from 'antd'
import { defineMessages, useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import { managerHref } from '../../../routes'
import type { DashboardFinance } from '../../../types/dashboard'
import { CashFlowChart } from './charts/CashFlowChart'

const messages = defineMessages({
  vi: {
    title: 'Doanh thu & dòng tiền',
    scope: 'Theo kỳ đã chọn · chỉ tính giao dịch đã xác nhận',
    received: 'Tiền đã thu',
    refunded: 'Tiền đã hoàn',
    net: 'Thực thu sau hoàn tiền',
    chart: 'Dòng tiền theo thời gian',
    cumulative: 'Thực thu lũy kế',
    refundDirection: 'Tiền hoàn hiển thị dưới trục 0 vì đây là khoản chi ra.',
    recent: 'Giao dịch gần đây',
    empty: 'Chưa có giao dịch trong kỳ này.',
    unavailable: 'Chưa có dữ liệu tài chính.',
    types: {
      DEPOSIT: 'Đặt cọc',
      MISSION_PAYMENT: 'Thanh toán nhiệm vụ',
      FINAL_PAYMENT: 'Thanh toán cuối',
      REFUND: 'Hoàn tiền',
    },
  },
  en: {
    title: 'Revenue & cash flow',
    scope: 'Selected period · confirmed transactions only',
    received: 'Payments received',
    refunded: 'Refunds paid',
    net: 'Net cash received',
    chart: 'Cash flow over time',
    cumulative: 'Cumulative net receipts',
    refundDirection:
      'Refunds appear below zero because they are cash outflows.',
    recent: 'Recent transactions',
    empty: 'No transactions in this period.',
    unavailable: 'Financial data is unavailable.',
    types: {
      DEPOSIT: 'Deposit',
      MISSION_PAYMENT: 'Mission payment',
      FINAL_PAYMENT: 'Final payment',
      REFUND: 'Refund',
    },
  },
})

export function DashboardFinancePanel({
  finance,
  compact = false,
  days = 30,
  generatedAt,
  onDaysChange,
}: {
  finance?: DashboardFinance | null
  compact?: boolean
  days?: number
  generatedAt?: string
  onDaysChange?: (days: number) => void
}) {
  const { t, locale } = useI18n(messages)
  const [bucket, setBucket] = useState<'day' | 'week' | 'month'>('week')
  const dates = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  })
  const timestamps = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  const points = finance?.cashFlow ?? []
  const received = points.reduce((total, point) => total + point.received, 0)
  const refunded = points.reduce((total, point) => total + point.refunded, 0)
  const chartPoints = points.map((point) => ({
    ...point,
    label: dates.format(new Date(point.date)),
  }))

  return (
    <section
      className={`mgr-dash-finance${compact ? ' is-compact' : ''}`}
      aria-label={t.title}
    >
      {!finance ? (
        <p>{t.unavailable}</p>
      ) : (
        <>
          <dl className="mgr-dash-money">
            <div>
              <dt>{t.net}</dt>
              <dd>{formatVnd(received - refunded)}</dd>
            </div>
            <div>
              <dt>{t.received}</dt>
              <dd>{formatVnd(received)}</dd>
            </div>
            <div>
              <dt>{t.refunded}</dt>
              <dd>{formatVnd(refunded)}</dd>
            </div>
          </dl>
          <div className="mgr-dash-finance-grid">
            <section>
              <div className="mgr-cashflow-toolbar">
                <h3>{t.chart}</h3>
                <div>
                  {onDaysChange && (
                    <Select
                      aria-label={
                        locale.startsWith('vi')
                          ? 'Khoảng thời gian'
                          : 'Time range'
                      }
                      value={days}
                      onChange={onDaysChange}
                      options={[7, 30, 90].map((value) => ({
                        value,
                        label: `${value} ${locale.startsWith('vi') ? 'ngày' : 'days'}`,
                      }))}
                    />
                  )}
                  <Select
                    aria-label={
                      locale.startsWith('vi') ? 'Nhóm thời gian' : 'Group by'
                    }
                    value={bucket}
                    onChange={setBucket}
                    options={[
                      {
                        value: 'day',
                        label: locale.startsWith('vi') ? 'Theo ngày' : 'Daily',
                      },
                      {
                        value: 'week',
                        label: locale.startsWith('vi') ? 'Theo tuần' : 'Weekly',
                      },
                      {
                        value: 'month',
                        label: locale.startsWith('vi')
                          ? 'Theo tháng'
                          : 'Monthly',
                      },
                    ]}
                  />
                </div>
              </div>
              {points.length ? (
                <>
                  <div className="mgr-dash-cashflow">
                    <CashFlowChart
                      points={points}
                      days={days}
                      bucket={bucket}
                      generatedAt={generatedAt}
                      locale={locale}
                      labels={{
                        received: t.received,
                        refunded: t.refunded,
                        cumulative: t.cumulative,
                      }}
                    />
                  </div>
                  <ul className="odm-visually-hidden">
                    {chartPoints.map((point) => (
                      <li key={point.date}>
                        {point.label} · {t.received} {formatVnd(point.received)}{' '}
                        · {t.refunded} {formatVnd(point.refunded)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>{t.empty}</p>
              )}
            </section>
            <details className="mgr-finance-recent" open={!compact}>
              <summary>
                {t.recent} ({finance.recentTransactions.length})
              </summary>
              {finance.recentTransactions.length ? (
                <ul className="mgr-dash-transactions">
                  {finance.recentTransactions.map((entry) => (
                    <li key={`${entry.type}:${entry.id}`}>
                      <div>
                        <strong>{t.types[entry.type]}</strong>
                        <a
                          href={managerHref({
                            screen: 'orderReview',
                            orderId: entry.orderId,
                          })}
                        >
                          {displayOrderCode(entry.orderCode, entry.orderId)}
                        </a>
                      </div>
                      <div>
                        <strong
                          style={{
                            color:
                              entry.type === 'REFUND'
                                ? 'var(--ant-color-warning-text, #b45309)'
                                : 'var(--ant-color-success-text, #09834b)',
                          }}
                          className={
                            entry.type === 'REFUND'
                              ? 'mgr-money-out'
                              : 'mgr-money-in'
                          }
                        >
                          {entry.type === 'REFUND' ? '−' : '+'}
                          {formatVnd(entry.amount)}
                        </strong>
                        <time dateTime={entry.occurredAt}>
                          {timestamps.format(new Date(entry.occurredAt))}
                        </time>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t.empty}</p>
              )}
            </details>
          </div>
        </>
      )}
    </section>
  )
}
