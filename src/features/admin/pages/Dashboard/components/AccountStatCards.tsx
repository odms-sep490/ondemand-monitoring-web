import { CheckCircleOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons'

import { StatisticComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { AccountStats } from '../accountStats'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'

/** KPI row: total / active / locked, values from the BE (`null` = loading). */
export function AccountStatCards({ stats }: { stats: AccountStats | null | undefined }) {
  const { t } = useI18n(adminDashboardPageMessages)
  const loading = !stats
  return (
    <div className="mgr-kpi-strip">
      <StatisticComponent
        index={0}
        title={t.totalAccounts}
        icon={<TeamOutlined aria-hidden="true" aria-label={undefined} />}
        tone="blue"
        value={stats?.total ?? 0}
        loading={loading}
        hint={t.systemWide}
      />
      <StatisticComponent
        index={1}
        title={t.active}
        icon={<CheckCircleOutlined aria-hidden="true" aria-label={undefined} />}
        tone="green"
        value={stats?.active ?? 0}
        loading={loading}
        hint={t.accountsUnit}
      />
      <StatisticComponent
        index={2}
        title={t.locked}
        icon={<LockOutlined aria-hidden="true" aria-label={undefined} />}
        tone={stats && stats.locked > 0 ? 'amber' : 'violet'}
        value={stats?.locked ?? 0}
        loading={loading}
        hint={t.accountsUnit}
      />
    </div>
  )
}
