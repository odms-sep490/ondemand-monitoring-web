import '@ant-design/v5-patch-for-react-19'
import { ReloadOutlined } from '@ant-design/icons'
import { Button, ConfigProvider } from 'antd'
import { useMemo, useState } from 'react'

import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { authSession } from '../../auth/api/authApi'
import { ErrorState } from '../../manager/components/common/ErrorState'
import { PageHeader } from '../../manager/components/common/PageHeader'
import { buildManagerTheme } from '../../manager/theme/managerTheme'
import { supportApi, type SupportTicketDto } from '../api/supportApi'
import {
  SUPPORT_STATUS_FILTERS,
  SupportFilters,
} from './StaffSupportDashboard/SupportFilters'
import { SupportInsights } from './StaffSupportDashboard/SupportInsights'
import { SupportKpis } from './StaffSupportDashboard/SupportKpis'
import { SupportTicketTable } from './StaffSupportDashboard/SupportTicketTable'
import { TicketDetailDrawer } from './StaffSupportDashboard/TicketDetailDrawer'
import { staffSupportMessages } from './StaffSupportDashboard/StaffSupportDashboard.messages'
import {
  computeInsights,
  countQueue,
  filterTickets,
} from './StaffSupportDashboard/supportMetrics'
import { useDocumentDark } from './StaffSupportDashboard/useDocumentDark'
import { useTicketActions } from './StaffSupportDashboard/useTicketActions'
import '../../manager/manager.css'
import '../../../shared/styles/app-shell/layout.scss'
import '../../../shared/styles/app-shell/popups.scss'
import '../../manager/components/common/planning.css'
import './StaffSupportDashboard/staffSupportDashboard.scss'

/**
 * Staff support queue. Rendered inside both the manager shell and the
 * drone-operator shell, so it carries its own `.mgr-layout` token scope and
 * antd theme (the manager shell's own provider is simply re-applied).
 */
export function StaffSupportDashboardPage() {
  const { t } = useI18n(staffSupportMessages)
  const dark = useDocumentDark()
  const themeConfig = useMemo(() => buildManagerTheme(dark), [dark])

  const role = authSession.getUser()?.role
  const canManage = role === 'MANAGER' || role === 'ADMIN'
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDto | null>(
    null,
  )

  const query = useApiQuery(
    (signal) => supportApi.listTickets(undefined, undefined, signal),
    [],
  )

  const staffAgentsQuery = useApiQuery(
    (signal) =>
      canManage ? supportApi.getStaffAgents(signal) : Promise.resolve([]),
    [canManage],
  )
  const staffAgents = staffAgentsQuery.data || []

  const analyticsQuery = useApiQuery(
    (signal) =>
      canManage ? supportApi.getAnalytics(signal) : Promise.resolve(undefined),
    [canManage],
  )

  const actions = useTicketActions(
    selectedTicket,
    setSelectedTicket,
    query.reload,
    {
      reply: t.errors.reply,
      status: t.errors.status,
      assign: t.errors.assign,
      unknown: t.errors.unknown,
    },
  )

  const allTickets = query.data || []
  const counts = countQueue(allTickets)
  const insights = computeInsights(allTickets, analyticsQuery.data)
  const filtered = filterTickets(
    allTickets,
    statusFilter,
    categoryFilter,
    searchQuery,
  )

  const statusCounts: Record<string, number> = {}
  for (const status of ['ALL', ...SUPPORT_STATUS_FILTERS]) {
    statusCounts[status] = filterTickets(
      allTickets,
      status,
      categoryFilter,
      searchQuery,
    ).length
  }

  return (
    <ConfigProvider theme={themeConfig}>
      <div className="mgr-layout sd-embed">
        <div className="mgr-view sd-page">
          <PageHeader
            title={t.page.title}
            description={t.page.subtitle}
            actions={
              <Button icon={<ReloadOutlined />} onClick={() => query.reload()}>
                {t.page.refresh}
              </Button>
            }
          />

          {query.error ? (
            <ErrorState
              title={t.page.loadError}
              error={query.error}
              onRetry={query.reload}
            />
          ) : (
            <>
              <SupportKpis
                counts={counts}
                statusFilter={statusFilter}
                onFilter={setStatusFilter}
              />
              <SupportFilters
                search={searchQuery}
                onSearch={setSearchQuery}
                status={statusFilter}
                onStatus={setStatusFilter}
                category={categoryFilter}
                onCategory={setCategoryFilter}
                statusCounts={statusCounts}
              />
              <SupportTicketTable
                rows={filtered}
                total={allTickets.length}
                loading={query.loading}
                canManage={canManage}
                selectedId={selectedTicket?.id ?? null}
                onSelect={setSelectedTicket}
              />
              <SupportInsights insights={insights} />
            </>
          )}

          {selectedTicket ? (
            <TicketDetailDrawer
              key={selectedTicket.id}
              ticket={selectedTicket}
              canManage={canManage}
              staffAgents={staffAgents}
              staffLoading={staffAgentsQuery.loading}
              actions={actions}
              onClose={() => setSelectedTicket(null)}
            />
          ) : null}
        </div>
      </div>
    </ConfigProvider>
  )
}
