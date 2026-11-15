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
import { dashboardActivityLabel, formatDashboardDate, statusLabel } from '../dashboardHelpers'
import { FunnelPipelineChart } from './charts/FunnelPipelineChart'

const MAX_MISSIONS = 2
const MAX_ACTIVITIES = 8

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
        <p className="mgr-data-unavailable" role="status">
          {m.overviewUnavailable}
        </p>
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
            <p className="mgr-mission-active-empty" role="status">
              {m.empty}
            </p>
          )
        ) : (
          <p className="mgr-mission-active-empty" role="status">
            {m.missionsUnavailable}
          </p>
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
        <p className="mgr-data-unavailable" role="status">
          {p.unavailable}
        </p>
      ) : (
        <FunnelPipelineChart stages={stages} empty={p.empty} ariaLabel={p.title} />
      )}
    </CardComponent>
  )
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
  const { t } = useI18n(dashboardPageMessages)
  return (
    <CardComponent className={className} title={t.activity.title}>
      {!activitiesAvailable ? (
        <p className="mgr-activity-empty" role="status">
          {t.activity.unavailable}
        </p>
      ) : activities.length === 0 ? (
        <p className="mgr-activity-empty" role="status">
          {t.activity.empty}
        </p>
      ) : (
        <ol className="mgr-activity-list">
          {activities.slice(0, MAX_ACTIVITIES).map((activity) => (
            <li key={activity.id}>
              <time className="mgr-time" dateTime={activity.occurredAt}>
                {formatDashboardDate(activity.occurredAt)}
              </time>
              <span className="mgr-timeline-text">{dashboardActivityLabel(activity.description)}</span>
            </li>
          ))}
        </ol>
      )}
    </CardComponent>
  )
}
