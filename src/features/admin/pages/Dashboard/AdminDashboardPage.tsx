import { Button } from 'antd'

import { ErrorState, PageHeader } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminApi } from '../../api/adminApi'
import { adminHref } from '../../routes'
import { fetchAccountStats } from './accountStats'
import { adminDashboardPageMessages } from './AdminDashboardPage.messages'
import { AccountStatCards } from './components/AccountStatCards'
import { RecentAccountsCard } from './components/RecentAccountsCard'
import { RoleBreakdown } from './components/RoleBreakdown'

export function AdminDashboardPage() {
  const { t } = useI18n(adminDashboardPageMessages)
  const stats = useApiQuery((signal) => fetchAccountStats(signal), [])
  const mock = useApiQuery((signal) => adminApi.getDashboard(signal), [])

  return (
    <div className="mgr-view">
      <PageHeader
        title={t.title}
        actions={
          <Button
            type="primary"
            href={adminHref({ screen: 'createAccount' })}
          >
            {t.createAccount}
          </Button>
        }
      />

      {stats.error ? (
        <ErrorState title={t.statsError} error={stats.error} onRetry={stats.reload} />
      ) : null}

      <AccountStatCards stats={stats.data} />

      <div className="adm-grid-wide">
        <RoleBreakdown stats={stats.data} />
        {mock.data ? <RecentAccountsCard accounts={mock.data.recentAccounts} /> : null}
      </div>
    </div>
  )
}
