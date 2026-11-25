import {
  BellOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { Button, Tag } from 'antd'
import { useState, type ReactNode } from 'react'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type {
  ActiveMission,
  DashboardActivity,
  MissionOverview,
  PricingPipeline,
} from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import {
  dashboardActivityLabel,
  formatDashboardDate,
  statusLabel,
} from '../dashboardHelpers'
import { DashboardEmptyState } from './DashboardEmptyState'
import { FunnelPipelineChart } from './charts/FunnelPipelineChart'

const MAX_MISSIONS = 2
const MAX_ACTIVITIES = 12

export function MissionStatusCard({
  overview,
  overviewAvailable,
  missions,
  missionsAvailable,
}: {
  overview: MissionOverview
  overviewAvailable: boolean
  missions: ActiveMission[]
  missionsAvailable: boolean
}) {
  const { t } = useI18n(dashboardPageMessages)
  const m = t.missions
  const statuses = [
    { label: m.scheduled, value: overview.scheduledCount },
    { label: m.ready, value: overview.readyCount },
    { label: m.inFlight, value: overview.inFlightCount },
    { label: m.returning, value: overview.returningCount },
    { label: m.completedToday, value: overview.completedTodayCount },
    { label: m.issues, value: overview.issueCount },
  ]

  return (
    <CardComponent
      className="mgr-mission-status-card"
      title={m.overviewTitle}
      extra={
        <a className="mgr-card-link" href={managerHref({ screen: 'missions' })}>
          {m.viewAll}
        </a>
      }
    >
      {overviewAvailable ? (
        <dl className="mgr-mission-overview-list">
          {statuses.map((status) => (
            <div className="mgr-mission-overview-item" key={status.label}>
              <dt>{status.label}</dt>
              <dd>{status.value.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <DashboardEmptyState variant="NO_DATA" title={m.overviewUnavailable} />
      )}

      <section className="mgr-mission-active-list" aria-label={m.activeList}>
        <h4>{m.activeList}</h4>
        {missionsAvailable ? (
          missions.length > 0 ? (
            <ul>
              {missions.slice(0, MAX_MISSIONS).map((mission) => (
                <li key={mission.missionId}>
                  <a
                    className="mgr-mission-active-row"
                    href={managerHref({
                      screen: 'missionDetail',
                      missionId: mission.missionId,
                    })}
                  >
                    <span className="mgr-mission-active-copy">
                      <strong>{mission.missionCode}</strong>
                      <span>
                        {formatDashboardDate(mission.scheduledStartAt)}
                        {' · '}
                        {mission.operatorName ?? m.operatorUnassigned}
                        {' · '}
                        {mission.droneName ?? m.unassigned}
                      </span>
                    </span>
                    <span
                      className={`mgr-mission-status${mission.attentionRequired ? ' is-alert' : ''}`}
                    >
                      {mission.attentionRequired
                        ? m.attention
                        : statusLabel(mission.status)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <DashboardEmptyState variant="NO_MISSIONS" title={m.empty} />
          )
        ) : (
          <DashboardEmptyState variant="NO_DATA" title={m.missionsUnavailable} />
        )}
      </section>
    </CardComponent>
  )
}

export function PipelineCard({
  pipeline,
  available,
}: {
  pipeline: PricingPipeline
  available: boolean
}) {
  const { t } = useI18n(dashboardPageMessages)
  const p = t.pipeline
  const stages = [
    { label: p.review, value: pipeline.pricingReviewCount },
    { label: p.quoteReady, value: pipeline.quoteReadyCount },
    { label: p.waitingCustomer, value: pipeline.waitingCustomerCount },
    { label: p.waitingDeposit, value: pipeline.waitingDepositCount },
    { label: p.depositPaid, value: pipeline.depositPaidCount },
  ]
  return (
    <CardComponent className="mgr-pipeline-card" title={p.title}>
      {!available ? (
        <DashboardEmptyState variant="NO_DATA" title={p.unavailable} />
      ) : (
        <FunnelPipelineChart
          stages={stages}
          empty={p.empty}
          ariaLabel={p.title}
        />
      )}
    </CardComponent>
  )
}

function activityVisual(type: string): { icon: ReactNode; tone: string } {
  const upper = (type || '').toUpperCase()
  if (upper.includes('PAY') || upper.includes('DEPOSIT') || upper.includes('REFUND')) {
    return { icon: <DollarOutlined />, tone: 'emerald' }
  }
  if (upper.includes('MISSION') || upper.includes('FLIGHT')) {
    return { icon: <RocketOutlined />, tone: 'blue' }
  }
  if (upper.includes('APPROV') || upper.includes('COMPLET')) {
    return { icon: <CheckCircleOutlined />, tone: 'emerald' }
  }
  if (upper.includes('ORDER') || upper.includes('QUOTE') || upper.includes('CONTRACT')) {
    return { icon: <FileTextOutlined />, tone: 'amber' }
  }
  return { icon: <BellOutlined />, tone: 'neutral' }
}

function activityCategory(type: string, vi: boolean): string {
  const upper = (type || '').toUpperCase()
  if (upper.includes('PAY') || upper.includes('DEPOSIT') || upper.includes('REFUND')) {
    return vi ? 'Thanh toán' : 'Payments'
  }
  if (upper.includes('MISSION') || upper.includes('FLIGHT')) {
    return vi ? 'Nhiệm vụ' : 'Missions'
  }
  if (upper.includes('ORDER') || upper.includes('QUOTE') || upper.includes('CONTRACT')) {
    return vi ? 'Đơn & báo giá' : 'Orders & quotes'
  }
  return vi ? 'Hệ thống' : 'System'
}

export function RecentActivityCard({
  activities,
  activitiesAvailable,
  className,
}: {
  activities: DashboardActivity[]
  activitiesAvailable: boolean
  className?: string
}) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const vi = locale.startsWith('vi')
  const [catFilter, setCatFilter] = useState<string>('ALL')

  const categories = Array.from(
    new Set(activities.map((a) => activityCategory(a.type, vi))),
  )
  const filtered =
    catFilter === 'ALL'
      ? activities
      : activities.filter((a) => activityCategory(a.type, vi) === catFilter)

  return (
    <CardComponent
      className={className}
      title={t.activity.title}
      extra={
        activities.length > 0 ? (
          <Tag bordered={false} color="processing">
            {activities.length} {vi ? 'sự kiện' : 'events'}
          </Tag>
        ) : null
      }
    >
      {!activitiesAvailable ? (
        <div className="mgr-activity-empty" role="status">
          <DashboardEmptyState variant="NO_DATA" title={t.activity.unavailable} />
        </div>
      ) : activities.length === 0 ? (
        <div className="mgr-activity-empty" role="status">
          <DashboardEmptyState
            variant="NO_DATA"
            title={t.activity.empty}
            description={
              vi
                ? 'Các sự kiện tạo đơn, duyệt giá, phân công và thanh toán sẽ hiển thị tại đây.'
                : 'Order, quotation, mission assignment, and payment events will appear here.'
            }
          />
        </div>
      ) : (
        <>
          {categories.length > 1 ? (
            <div className="mgr-filter-row" role="group">
              <Button
                size="small"
                type={catFilter === 'ALL' ? 'primary' : 'default'}
                onClick={() => setCatFilter('ALL')}
              >
                {vi ? 'Tất cả' : 'All'} ({activities.length})
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="small"
                  type={catFilter === cat ? 'primary' : 'default'}
                  onClick={() => setCatFilter(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          ) : null}

          <ol className="mgr-activity-list mgr-timeline-list">
            {filtered.slice(0, MAX_ACTIVITIES).map((activity) => {
              const { icon, tone } = activityVisual(activity.type)
              const cat = activityCategory(activity.type, vi)
              return (
                <li key={activity.id} className="mgr-timeline-item">
                  <span
                    className={`mgr-timeline-node is-${tone}`}
                    aria-hidden="true"
                  >
                    {icon}
                  </span>
                  <div className="mgr-timeline-card">
                    <div className="mgr-timeline-top">
                      <span className="mgr-timeline-cat">{cat}</span>
                      <time className="mgr-time" dateTime={activity.occurredAt}>
                        {formatDashboardDate(activity.occurredAt)}
                      </time>
                    </div>
                    <p className="mgr-timeline-text">
                      {dashboardActivityLabel(activity.description)}
                    </p>
                    {activity.orderId || activity.missionId ? (
                      <div className="mgr-timeline-links">
                        {activity.orderId ? (
                          <a
                            className="mgr-task-code"
                            href={managerHref({
                              screen: 'orderReview',
                              orderId: activity.orderId,
                            })}
                          >
                            {activity.orderCode ?? activity.orderId}
                          </a>
                        ) : null}
                        {activity.missionId ? (
                          <a
                            className="mgr-task-code"
                            href={managerHref({
                              screen: 'missionDetail',
                              missionId: activity.missionId,
                            })}
                          >
                            {vi ? 'Mở nhiệm vụ' : 'Open mission'}
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </CardComponent>
  )
}
