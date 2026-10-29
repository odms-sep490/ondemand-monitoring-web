import { Tabs } from 'antd'
import type { Dispatch, SetStateAction } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import type { MaintenanceTicketDto } from '../../../api/maintenanceTicketApi'
import { maintenancePageMessages } from '../MaintenancePage.messages'

type TabKey = 'RESOLVED' | 'MY_TICKETS' | 'ALL_ACTIVE'

export function MaintenanceTabs({
  setActiveTab,
  activeTab,
  myOpenCount,
  allTickets,
}: {
  setActiveTab: Dispatch<SetStateAction<TabKey>>
  activeTab: TabKey
  myOpenCount: number
  allTickets: MaintenanceTicketDto[]
}) {
  const { t } = useI18n(maintenancePageMessages)
  const active = allTickets.filter(
    (ticket) => ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS',
  ).length
  const resolved = allTickets.filter(
    (ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED',
  ).length
  return (
    <Tabs
      activeKey={activeTab}
      onChange={(key) => setActiveTab(key as TabKey)}
      items={[
        { key: 'MY_TICKETS', label: t.tabMine(myOpenCount) },
        { key: 'ALL_ACTIVE', label: t.tabAllActive(active) },
        { key: 'RESOLVED', label: t.tabResolved(resolved) },
      ]}
    />
  )
}
