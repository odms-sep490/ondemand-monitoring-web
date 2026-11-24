import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  RollbackOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Button, Select, Tag } from 'antd'
import { useState } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { defineMessages, useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { displayOrderCode } from '../../../../../shared/lib/orderCode'
import { managerHref } from '../../../routes'
import type { DashboardFinance } from '../../../types/dashboard'
import { DashboardEmptyState } from './DashboardEmptyState'
import { CashFlowChart } from './charts/CashFlowChart'

const messages = defineMessages({
  vi: {
    title: 'Doanh thu & dòng tiền',
    scope: 'Chỉ tính giao dịch đã xác nhận',
    received: 'Tiền đã thu',
    refunded: 'Tiền đã hoàn',
    net: 'Thực thu sau hoàn tiền',
    chart: 'Dòng tiền theo thời gian',
    cumulative: 'Thực thu lũy kế',
    recent: 'Giao dịch gần đây',
    allTypes: 'Tất cả',
    empty: 'Chưa có giao dịch trong kỳ này.',
    emptyFilter: 'Không có giao dịch thuộc loại đã chọn.',
    clearFilter: 'Xem tất cả',
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
    scope: 'Confirmed transactions only',
    received: 'Payments received',
    refunded: 'Refunds paid',
    net: 'Net cash received',
    chart: 'Cash flow over time',
    cumulative: 'Cumulative net receipts',
    recent: 'Recent transactions',
    allTypes: 'All',
    empty: 'No transactions in this period.',
    emptyFilter: 'No transactions match this filter.',
    clearFilter: 'Show all',
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
  const [txFilter, setTxFilter] = useState<string>('ALL')
  const vi = locale.startsWith('vi')

  const timestamps = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  })

  if (!finance) {
    return (
      <section className="mgr-dash-finance" aria-label={t.title}>
        <DashboardEmptyState variant="NO_DATA" title={t.unavailable} />
      </section>
    )
  }

  const points = finance.cashFlow ?? []
  const received = points.reduce((total, point) => total + point.received, 0)
  const refunded = points.reduce((total, point) => total + point.refunded, 0)
  const net = received - refunded

  const allTx = finance.recentTransactions ?? []
  const txTypes = Array.from(new Set(allTx.map((tx) => tx.type)))
  const visibleTx =
    txFilter === 'ALL' ? allTx : allTx.filter((tx) => tx.type === txFilter)

  return (
    <section
      className={`mgr-dash-finance${compact ? ' is-compact' : ''}`}
      aria-label={t.title}
    >
      {/* Financial KPI strip */}
      <div className="mgr-finance-kpi-grid">
        <div className="mgr-finance-kpi is-net">
          <span className="mgr-kpi-icon is-emerald" aria-hidden="true">
            <WalletOutlined />
          </span>
          <div>
            <div className="mgr-finance-kpi-label">{t.net}</div>
            <strong className="mgr-finance-kpi-value">{formatVnd(net)}</strong>
            <div className="mgr-finance-kpi-note">{t.scope}</div>
          </div>
        </div>
        <div className="mgr-finance-kpi is-in">
          <span className="mgr-kpi-icon is-blue" aria-hidden="true">
            <ArrowUpOutlined />
          </span>
          <div>
            <div className="mgr-finance-kpi-label">{t.received}</div>
            <strong className="mgr-finance-kpi-value">
              {formatVnd(received)}
            </strong>
          </div>
        </div>
        <div className="mgr-finance-kpi is-out">
          <span className="mgr-kpi-icon is-amber" aria-hidden="true">
            <RollbackOutlined />
          </span>
          <div>
            <div className="mgr-finance-kpi-label">{t.refunded}</div>
            <strong className="mgr-finance-kpi-value">
              {formatVnd(refunded)}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Finance Grid: Cash Flow Chart + Filterable Transactions */}
      <div className="mgr-dash-finance-grid">
        <CardComponent
          title={t.chart}
          className="mgr-finance-chart-card"
          extra={
            <div className="mgr-cashflow-controls">
              {onDaysChange && (
                <Select
                  size="small"
                  aria-label={vi ? 'Khoảng thời gian' : 'Time range'}
                  value={days}
                  onChange={onDaysChange}
                  options={[7, 30, 90].map((value) => ({
                    value,
                    label: `${value} ${vi ? 'ngày' : 'days'}`,
                  }))}
                />
              )}
              <Select
                size="small"
                aria-label={vi ? 'Nhóm thời gian' : 'Group by'}
                value={bucket}
                onChange={setBucket}
                options={[
                  { value: 'day', label: vi ? 'Theo ngày' : 'Daily' },
                  { value: 'week', label: vi ? 'Theo tuần' : 'Weekly' },
                  { value: 'month', label: vi ? 'Theo tháng' : 'Monthly' },
                ]}
              />
            </div>
          }
        >
          {points.length > 0 ? (
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
          ) : (
            <DashboardEmptyState variant="NO_DATA" title={t.empty} />
          )}
        </CardComponent>

        <CardComponent
          title={`${t.recent} (${allTx.length})`}
          className="mgr-finance-tx-card"
        >
          {txTypes.length > 1 ? (
            <div className="mgr-filter-row" role="group">
              <Button
                size="small"
                type={txFilter === 'ALL' ? 'primary' : 'default'}
                onClick={() => setTxFilter('ALL')}
              >
                {t.allTypes} ({allTx.length})
              </Button>
              {txTypes.map((type) => (
                <Button
                  key={type}
                  size="small"
                  type={txFilter === type ? 'primary' : 'default'}
                  onClick={() => setTxFilter(type)}
                >
                  {t.types[type]}
                </Button>
              ))}
            </div>
          ) : null}

          {allTx.length === 0 ? (
            <DashboardEmptyState variant="NO_DATA" title={t.empty} />
          ) : visibleTx.length === 0 ? (
            <DashboardEmptyState
              variant="NO_DATA_FOR_FILTER"
              title={t.emptyFilter}
              actionLabel={t.clearFilter}
              onAction={() => setTxFilter('ALL')}
            />
          ) : (
            <ul className="mgr-tx-list">
              {visibleTx.map((entry) => {
                const isRefund = entry.type === 'REFUND'
                return (
                  <li key={`${entry.type}:${entry.id}`} className="mgr-tx-item">
                    <span
                      className={`mgr-tx-badge ${isRefund ? 'is-out' : 'is-in'}`}
                      aria-hidden="true"
                    >
                      {isRefund ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                    </span>
                    <div className="mgr-tx-main">
                      <div className="mgr-tx-title">
                        <strong>{t.types[entry.type]}</strong>
                        <Tag bordered={false} className="mgr-tx-code-tag">
                          <a
                            href={managerHref({
                              screen: 'orderReview',
                              orderId: entry.orderId,
                            })}
                          >
                            {displayOrderCode(entry.orderCode, entry.orderId)}
                          </a>
                        </Tag>
                      </div>
                      <time className="mgr-tx-time" dateTime={entry.occurredAt}>
                        {timestamps.format(new Date(entry.occurredAt))}
                      </time>
                    </div>
                    <strong
                      className={`mgr-tx-amount ${isRefund ? 'is-out' : 'is-in'}`}
                    >
                      {isRefund ? '−' : '+'}
                      {formatVnd(entry.amount)}
                    </strong>
                  </li>
                )
              })}
            </ul>
          )}
        </CardComponent>
      </div>
    </section>
  )
}
