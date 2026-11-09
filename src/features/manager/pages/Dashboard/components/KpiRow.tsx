import { useI18n } from '../../../../../shared/i18n'
import { managerHref, type ManagerRoute } from '../../../routes'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'

type MetricTone = 'warning' | 'info' | 'success' | 'danger'

function KpiLink({
  route,
  title,
  value,
  tone = 'info',
  hint,
}: {
  route: ManagerRoute
  title: string
  value: number
  tone?: MetricTone
  hint?: string
}) {
  return (
    <a
      className={`mgr-dash-kpi mgr-kpi-${tone}`}
      href={managerHref(route)}
      aria-label={`${title}: ${value}`}
    >
      <span className="mgr-kpi-label">{title}</span>
      <strong className="mgr-kpi-value" aria-hidden="true">{value.toLocaleString()}</strong>
      {hint ? <span className="mgr-kpi-hint">{hint}</span> : null}
    </a>
  )
}

export function KpiRow({ data }: { data: ManagerDashboardData }) {
  const { t } = useI18n(dashboardPageMessages)
  const s = data.summary
  const p = data.pricingPipeline
  const completed = data.missionTrend.reduce((sum, point) => sum + point.completed, 0)
  const failed = data.missionTrend.reduce((sum, point) => sum + point.failed, 0)
  const queue: ManagerRoute = { screen: 'orderQueue' }
  const missions: ManagerRoute = { screen: 'missions' }

  return (
    <section className="mgr-kpi-grid" aria-label={t.kpi.overviewLabel}>
      <KpiLink
        route={queue}
        title={t.kpi.pendingReview}
        value={s.pendingOrderCount}
        tone={s.pendingOrderCount > 0 ? 'warning' : 'info'}
      />
      <KpiLink
        route={queue}
        title={t.kpi.waitingQuote}
        value={p.pricingReviewCount + p.quoteReadyCount}
      />
      <KpiLink
        route={queue}
        title={t.kpi.waitingDeposit}
        value={s.waitingDepositCount}
        hint={p.depositPaidCount > 0 ? t.kpi.waitingDepositHint(p.depositPaidCount) : undefined}
        tone={s.waitingDepositCount > 0 ? 'warning' : 'info'}
      />
      <KpiLink
        route={missions}
        title={t.kpi.activeMissions}
        value={s.activeMissionCount}
        hint={s.attentionRequiredCount > 0 ? t.kpi.attentionHint(s.attentionRequiredCount) : undefined}
        tone={s.attentionRequiredCount > 0 ? 'danger' : 'success'}
      />
      <KpiLink
        route={missions}
        title={t.kpi.completed}
        value={completed}
        hint={failed > 0 ? t.kpi.completedHint(failed) : undefined}
        tone="success"
      />
    </section>
  )
}
