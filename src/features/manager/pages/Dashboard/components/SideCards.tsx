import { Empty, Progress, Timeline } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type { ActiveMission, DashboardActivity, PricingPipeline } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { formatDashboardDate, statusLabel } from '../dashboardHelpers'
import { MANAGER_COLORS } from '../../../theme/managerTheme'

const MAX_MISSIONS = 6
const MAX_ACTIVITIES = 8

export function ActiveMissionsCard({ missions }: { missions: ActiveMission[] }) {
  const { t } = useI18n(dashboardPageMessages)
  const m = t.missions
  return (
    <CardComponent
      className="mgr-active-missions-card"
      title={m.title}
      extra={
        <a className="mgr-card-link" href={managerHref({ screen: 'missions' })}>
          {m.viewAll}
        </a>
      }
    >
      {missions.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={m.empty} />
      ) : (
        <ul className="m-0 list-none p-0">
          {missions.slice(0, MAX_MISSIONS).map((mission) => (
            <li key={mission.missionId}>
              <a
                className="mgr-dash-row mgr-dash-row-link"
                href={managerHref({ screen: 'missionDetail', missionId: mission.missionId })}
              >
                <span className={`mgr-live ${mission.attentionRequired ? 'is-alert' : ''}`} aria-hidden="true" />
                <div className="mgr-dash-row-main">
                  <div className="mgr-dash-row-title">{mission.missionCode}</div>
                  <div className="mgr-dash-row-meta">
                    {formatDashboardDate(mission.scheduledStartAt)}
                    {' · '}{mission.operatorName ?? m.operatorUnassigned}
                    {' · '}{mission.droneName ?? m.unassigned}
                  </div>
                </div>
                <span className={`mgr-mission-status${mission.attentionRequired ? ' is-alert' : ''}`}>
                  {mission.attentionRequired ? m.attention : statusLabel(mission.status)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </CardComponent>
  )
}

export function PipelineCard({ pipeline }: { pipeline: PricingPipeline }) {
  const { t } = useI18n(dashboardPageMessages)
  const p = t.pipeline
  const stages = [
    { label: p.review, value: pipeline.pricingReviewCount },
    { label: p.quoteReady, value: pipeline.quoteReadyCount },
    { label: p.waitingCustomer, value: pipeline.waitingCustomerCount },
    { label: p.waitingDeposit, value: pipeline.waitingDepositCount },
    { label: p.depositPaid, value: pipeline.depositPaidCount },
  ]
  const max = Math.max(...stages.map((s) => s.value))
  return (
    <CardComponent className="mgr-pipeline-card" title={p.title}>
      {max === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={p.empty} />
      ) : (
        <div className="mgr-pipeline-list">
          {stages.map((s) => (
            <div key={s.label}>
              <div className="mgr-pipe-row">
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
              <Progress
                percent={(s.value / max) * 100}
                showInfo={false}
                size={['100%', 8]}
                strokeColor={MANAGER_COLORS.primary}
              />
            </div>
          ))}
        </div>
      )}
    </CardComponent>
  )
}

export function RecentActivityCard({ activities, className }: { activities: DashboardActivity[]; className?: string }) {
  const { t } = useI18n(dashboardPageMessages)
  return (
    <CardComponent className={className} title={t.activity.title}>
      {activities.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.activity.empty} />
      ) : (
        <Timeline
          items={activities.slice(0, MAX_ACTIVITIES).map((activity) => ({
            key: activity.id,
            color: MANAGER_COLORS.primary,
            children: (
              <div>
                <time className="mgr-time" dateTime={activity.occurredAt}>
                  {formatDashboardDate(activity.occurredAt)}
                </time>
                <span className="mgr-timeline-text">{activity.description}</span>
              </div>
            ),
          }))}
        />
      )}
    </CardComponent>
  )
}
