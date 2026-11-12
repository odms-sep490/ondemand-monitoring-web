import { useI18n } from '../../../../../shared/i18n'
import { managerHref, type ManagerRoute } from '../../../routes'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'

export type DashboardKpiAvailability = {
  pendingReview: boolean
  waitingQuote: boolean
  waitingDeposit: boolean
  activeMissions: boolean
  completed: boolean
}

function KpiLink({
  route,
  title,
  value,
  available,
  unavailableLabel,
}: {
  route: ManagerRoute
  title: string
  value: number
  available: boolean
  unavailableLabel: string
}) {
  return (
    <a
      className="mgr-dash-kpi"
      href={managerHref(route)}
      aria-label={`${title}: ${available ? value.toLocaleString() : unavailableLabel}`}
    >
      <span className="mgr-kpi-copy">
        <span className="mgr-kpi-label">{title}</span>
        <strong className="mgr-kpi-value" aria-hidden="true">
          {available ? value.toLocaleString() : '—'}
        </strong>
      </span>
    </a>
  )
}

export function KpiRow({
  data,
  availability,
}: {
  data: ManagerDashboardData
  availability: DashboardKpiAvailability
}) {
  const { t } = useI18n(dashboardPageMessages)
  const s = data.summary
  const p = data.pricingPipeline
  const completed = data.missionTrend.reduce((sum, point) => sum + point.completed, 0)
  const queue: ManagerRoute = { screen: 'orderQueue' }
  const missions: ManagerRoute = { screen: 'missions' }

  return (
    <section className="mgr-kpi-grid" aria-label={t.kpi.overviewLabel}>
      <KpiLink
        route={queue}
        title={t.kpi.pendingReview}
        value={s.pendingOrderCount}
        available={availability.pendingReview}
        unavailableLabel={t.kpi.unavailable}
      />
      <KpiLink
        route={queue}
        title={t.kpi.waitingQuote}
        value={p.pricingReviewCount + p.quoteReadyCount}
        available={availability.waitingQuote}
        unavailableLabel={t.kpi.unavailable}
      />
      <KpiLink
        route={queue}
        title={t.kpi.waitingDeposit}
        value={s.waitingDepositCount}
        available={availability.waitingDeposit}
        unavailableLabel={t.kpi.unavailable}
      />
      <KpiLink
        route={missions}
        title={t.kpi.activeMissions}
        value={s.activeMissionCount}
        available={availability.activeMissions}
        unavailableLabel={t.kpi.unavailable}
      />
      <KpiLink
        route={missions}
        title={t.kpi.completed}
        value={completed}
        available={availability.completed}
        unavailableLabel={t.kpi.unavailable}
      />
    </section>
  )
}
