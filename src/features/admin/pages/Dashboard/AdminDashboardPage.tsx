import { useEffect, useRef, useState } from 'react'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import '../../../manager/manager.css'
import '../../../manager/pages/Dashboard/dashboard.scss'
import { adminApi } from '../../api/adminApi'
import { fetchAccountStats } from '../../lib/accountStats'
import './adminDashboard.scss'
import { AttentionCard } from './components/AttentionCard'
import { DashboardCharts } from './components/DashboardCharts'
import { DashboardHero } from './components/DashboardHero'
import { DashboardKpis } from './components/DashboardKpis'
import { QuickActionsCard } from './components/QuickActionsCard'
import { RecentAccountsCard } from './components/RecentAccountsCard'
import { SystemConfigCard } from './components/SystemConfigCard'
import {
  fetchCatalogSummary,
  fetchChecklistSummary,
  fetchDeviceSummary,
  fetchPolicySummary,
  fetchRecentAccounts,
} from './dashboardData'
import { buildAlerts } from './dashboardStats'

/** Each source is its own query, so one failing endpoint only affects its cards. */
export function AdminDashboardPage() {
  const stats = useApiQuery((s) => fetchAccountStats(s), [])
  const recent = useApiQuery((s) => fetchRecentAccounts(s), [])
  const devices = useApiQuery((s) => fetchDeviceSummary(s), [])
  const catalog = useApiQuery((s) => fetchCatalogSummary(s), [])
  const checklists = useApiQuery((s) => fetchChecklistSummary(s), [])
  const policies = useApiQuery((s) => fetchPolicySummary(s), [])
  const expiration = useApiQuery(
    (s) => adminApi.getOrderExpirationSettings(s),
    [],
  )
  const all = [
    stats,
    recent,
    devices,
    catalog,
    checklists,
    policies,
    expiration,
  ]

  const loading = all.some((q) => q.loading)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const wasLoading = useRef(true)
  useEffect(() => {
    if (wasLoading.current && !loading) setUpdatedAt(new Date())
    wasLoading.current = loading
  }, [loading])

  const alerts = buildAlerts({
    locked: stats.data?.locked,
    unverified: stats.data?.unverified,
    devices: devices.data?.groups,
    servicesWithoutChecklist: checklists.data?.servicesWithoutChecklist,
    policies: policies.data,
  })
  const now = new Date()

  return (
    <div className="mgr-dash adm-dash">
      <DashboardHero
        alertCount={alerts.length}
        updatedAt={updatedAt}
        refreshing={loading}
        onRefresh={() => all.forEach((q) => q.reload())}
      />
      <DashboardKpis
        stats={stats}
        recent={recent}
        devices={devices}
        catalog={catalog}
        checklists={checklists}
        now={now}
      />
      <div className="mgr-columns">
        <div className="mgr-stack">
          <DashboardCharts
            stats={stats}
            recent={recent}
            devices={devices}
            now={now}
          />
          <RecentAccountsCard recent={recent} />
        </div>
        <div className="mgr-stack">
          <AttentionCard alerts={alerts} settled={!loading} />
          <SystemConfigCard
            policies={policies}
            expiration={expiration}
            catalog={catalog}
            devices={devices}
          />
          <QuickActionsCard />
        </div>
      </div>
    </div>
  )
}
