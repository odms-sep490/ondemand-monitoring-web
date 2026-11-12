import {
  BellOutlined,
  CalendarOutlined,
  FileDoneOutlined,
} from '@ant-design/icons'
import { Button, Skeleton, Tag } from 'antd'

import {
  CardComponent,
  EmptyState,
} from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { getMissionStatusLabel } from '../../../../../shared/lib/statusTone'
import type { OrderRow } from '../../../lib/orders/types'
import { fmtDateTime } from '../../../lib/orderStatus'
import { customerHref } from '../../../routes'
import type { DashboardMissionData } from '../hooks/useDashboardData'
import { dashboardHighlightsMessages } from './DashboardHighlights.messages'

const DISPLAY_LIMIT = 3
const RESULT_STATUSES = new Set(['COMPLETED', 'FAILED'])
const ACTIVE_STATUSES = new Set([
  'IN_FLIGHT',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'AWAITING_REVIEW',
  'PENDING_REVIEW',
  'COMPLETED',
  'FAILED',
  'FAILED_PREFLIGHT',
  'CANCELLED',
])

function actionFor(
  order: OrderRow,
  t: (typeof dashboardHighlightsMessages)['vi'],
) {
  if (order.missionPaymentState === 'ACTION_REQUIRED') return t.actionMissionPayment
  if (order.depositState === 'ACTION_REQUIRED') return t.actionDeposit
  if (order.status === 'NEEDS_INFO') return t.actionNeedsInfo
  return t.actionDraft
}

function actionOrders(orders: OrderRow[]) {
  return orders
    .filter(
      (order) =>
        order.status === 'DRAFT' ||
        order.status === 'NEEDS_INFO' ||
        order.depositState === 'ACTION_REQUIRED' ||
        order.missionPaymentState === 'ACTION_REQUIRED',
    )
    .slice(0, DISPLAY_LIMIT)
}

function timestamp(value: string | null | undefined) {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function DashboardHighlights({
  orders,
  missionData,
  missionLoading,
  onRetry,
}: {
  orders: OrderRow[]
  missionData?: DashboardMissionData
  missionLoading: boolean
  onRetry: () => void
}) {
  const { t, locale, lang } = useI18n(dashboardHighlightsMessages)
  const actions = actionOrders(orders)
  const now = Date.now()
  const upcoming = (missionData?.items ?? [])
    .filter(({ mission }) => {
      const start = timestamp(mission.scheduledStartAt)
      return (
        start !== null && start >= now && !ACTIVE_STATUSES.has(mission.status)
      )
    })
    .sort(
      (a, b) =>
        timestamp(a.mission.scheduledStartAt)! -
        timestamp(b.mission.scheduledStartAt)!,
    )
    .slice(0, DISPLAY_LIMIT)
  const results = (missionData?.items ?? [])
    .filter(
      ({ mission }) =>
        mission.reportAvailable && RESULT_STATUSES.has(mission.status),
    )
    .sort((a, b) => {
      const aAt =
        timestamp(a.mission.scheduledEndAt ?? a.mission.scheduledStartAt) ?? 0
      const bAt =
        timestamp(b.mission.scheduledEndAt ?? b.mission.scheduledStartAt) ?? 0
      return bAt - aAt
    })
    .slice(0, DISPLAY_LIMIT)

  return (
    <section
      className="cus-highlights"
      aria-label={`${t.actionsTitle}, ${t.upcomingTitle}, ${t.resultsTitle}`}
    >
      <CardComponent
        className="cus-highlight-card"
        title={t.actionsTitle}
        icon={<BellOutlined />}
      >
        {actions.length === 0 ? (
          <EmptyState title={t.actionsEmpty} />
        ) : (
          <ul className="cus-highlight-list">
            {actions.map((order) => (
              <li key={order.id}>
                <div className="cus-highlight-copy">
                  <a
                    href={customerHref({
                      screen: 'orderDetail',
                      orderId: order.id,
                    })}
                  >
                    {order.title || order.code}
                  </a>
                  <span>
                    {order.code}
                    {order.address ? ` · ${order.address}` : ''}
                  </span>
                </div>
                <Button
                  type="link"
                  size="small"
                  href={customerHref({
                    screen: 'orderDetail',
                    orderId: order.id,
                  })}
                >
                  {actionFor(order, t)}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardComponent>

      <CardComponent
        className="cus-highlight-card"
        title={t.upcomingTitle}
        icon={<CalendarOutlined />}
      >
        {missionLoading ? (
          <div className="cus-highlight-loading" role="status" aria-busy="true">
            <Skeleton active title={false} paragraph={{ rows: 2 }} />
            <span className="odm-visually-hidden">{t.loading}</span>
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState title={t.upcomingEmpty} />
        ) : (
          <ul className="cus-highlight-list">
            {upcoming.map(({ order, mission }) => (
              <li key={mission.missionId}>
                <div className="cus-highlight-copy">
                  <a
                    href={customerHref({
                      screen: 'missionReport',
                      orderId: order.id,
                      missionId: mission.missionId,
                    })}
                  >
                    {mission.missionCode}
                  </a>
                  <span>
                    {fmtDateTime(mission.scheduledStartAt!, locale)} ·{' '}
                    {order.title || order.code}
                  </span>
                </div>
                <Tag color="blue">
                  {getMissionStatusLabel(mission.status, lang)}
                </Tag>
              </li>
            ))}
          </ul>
        )}
        {!missionLoading && (missionData?.unavailableOrderCount ?? 0) > 0 ? (
          <p className="cus-highlight-note" role="status">
            {t.partialError}{' '}
            <Button type="link" size="small" onClick={onRetry}>
              {t.retry}
            </Button>
          </p>
        ) : null}
      </CardComponent>

      <CardComponent
        className="cus-highlight-card"
        title={t.resultsTitle}
        icon={<FileDoneOutlined />}
        extra={
          <a
            className="mgr-card-link"
            href={customerHref({ screen: 'missionHistory' })}
          >
            {t.viewHistory}
          </a>
        }
      >
        {missionLoading ? (
          <div className="cus-highlight-loading" role="status" aria-busy="true">
            <Skeleton active title={false} paragraph={{ rows: 2 }} />
            <span className="odm-visually-hidden">{t.loading}</span>
          </div>
        ) : results.length === 0 ? (
          <EmptyState title={t.resultsEmpty} />
        ) : (
          <ul className="cus-highlight-list">
            {results.map(({ order, mission }) => (
              <li key={mission.missionId}>
                <div className="cus-highlight-copy">
                  <a
                    href={customerHref({
                      screen: 'missionHistoryDetail',
                      missionId: mission.missionId,
                    })}
                  >
                    {mission.missionCode}
                  </a>
                  <span>
                    {order.title || order.code} ·{' '}
                    {getMissionStatusLabel(mission.status, lang)}
                  </span>
                </div>
                <Button
                  type="link"
                  size="small"
                  href={customerHref({
                    screen: 'missionHistoryDetail',
                    missionId: mission.missionId,
                  })}
                >
                  {t.viewResult}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {!missionLoading && (missionData?.unavailableOrderCount ?? 0) > 0 ? (
          <p className="cus-highlight-note" role="status">
            {t.partialError}{' '}
            <Button type="link" size="small" onClick={onRetry}>
              {t.retry}
            </Button>
          </p>
        ) : null}
      </CardComponent>
    </section>
  )
}
