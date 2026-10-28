import {
  AlertOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileSearchOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

import { StatisticComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref, type ManagerRoute } from '../../../routes'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'

function KpiLink({ route, children }: { route: ManagerRoute; children: ReactNode }) {
  return (
    <a className="mgr-dash-kpi" href={managerHref(route)}>
      {children}
    </a>
  )
}

export function KpiRow({ data }: { data: ManagerDashboardData }) {
  const { t } = useI18n(dashboardPageMessages)
  const k = t.kpi
  const s = data.summary
  const p = data.pricingPipeline
  const completed = data.missionTrend.reduce((sum, point) => sum + point.completed, 0)
  const failed = data.missionTrend.reduce((sum, point) => sum + point.failed, 0)
  const completedSeries = data.missionTrend.map((point) => point.completed)
  const queue: ManagerRoute = { screen: 'orderQueue' }
  const missions: ManagerRoute = { screen: 'missions' }
  const attention = s.attentionRequiredCount > 0
  return (
    <div className="mgr-kpi-grid">
      <KpiLink route={queue}>
        <StatisticComponent
          index={0}
          tone={s.pendingOrderCount > 0 ? 'amber' : 'blue'}
          icon={<FileSearchOutlined />}
          title={k.pendingReview}
          value={s.pendingOrderCount}
        />
      </KpiLink>
      <KpiLink route={queue}>
        <StatisticComponent
          index={1}
          tone="blue"
          icon={<DollarOutlined />}
          title={k.waitingQuote}
          value={p.pricingReviewCount + p.quoteReadyCount}
        />
      </KpiLink>
      <KpiLink route={queue}>
        <StatisticComponent
          index={2}
          tone="violet"
          icon={<AlertOutlined />}
          title={k.waitingDeposit}
          value={s.waitingDepositCount}
          hint={p.depositPaidCount > 0 ? k.waitingDepositHint(p.depositPaidCount) : undefined}
        />
      </KpiLink>
      <KpiLink route={missions}>
        <StatisticComponent
          index={3}
          tone={attention ? 'red' : 'green'}
          icon={<RocketOutlined />}
          title={k.activeMissions}
          value={s.activeMissionCount}
          hint={attention ? k.attentionHint(s.attentionRequiredCount) : undefined}
        />
      </KpiLink>
      <KpiLink route={missions}>
        <StatisticComponent
          index={4}
          tone="green"
          icon={<CheckCircleOutlined />}
          title={k.completed}
          value={completed}
          hint={failed > 0 ? k.completedHint(failed) : undefined}
          hintTone="red"
          spark={completedSeries}
        />
      </KpiLink>
    </div>
  )
}
