import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { MaintenanceTicketDto } from '../../../api/maintenanceTicketApi'

export function MaintenanceTabs({
  setActiveTab,
  activeTab,
  myOpenCount,
  allTickets,
}: {
  setActiveTab: Dispatch<
    SetStateAction<'RESOLVED' | 'MY_TICKETS' | 'ALL_ACTIVE'>
  >
  activeTab: 'RESOLVED' | 'MY_TICKETS' | 'ALL_ACTIVE'
  myOpenCount: number
  allTickets: MaintenanceTicketDto[]
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        borderBottom: '1px solid #e2e8f0',
        marginBottom: 20,
      }}
    >
      <button
        type="button"
        onClick={() => setActiveTab('MY_TICKETS')}
        style={{
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          borderBottom:
            activeTab === 'MY_TICKETS'
              ? '2px solid #2563eb'
              : '2px solid transparent',
          fontWeight: activeTab === 'MY_TICKETS' ? 700 : 500,
          color: activeTab === 'MY_TICKETS' ? '#2563eb' : '#64748b',
          cursor: 'pointer',
          fontSize: 13.5,
          transition: 'all 0.15s ease',
        }}
      >
        {t.tabMine(myOpenCount)}
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('ALL_ACTIVE')}
        style={{
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          borderBottom:
            activeTab === 'ALL_ACTIVE'
              ? '2px solid #2563eb'
              : '2px solid transparent',
          fontWeight: activeTab === 'ALL_ACTIVE' ? 700 : 500,
          color: activeTab === 'ALL_ACTIVE' ? '#2563eb' : '#64748b',
          cursor: 'pointer',
          fontSize: 13.5,
        }}
      >
        {t.tabAllActive(
          allTickets.filter(
            (ticket) =>
              ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS',
          ).length,
        )}
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('RESOLVED')}
        style={{
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          borderBottom:
            activeTab === 'RESOLVED'
              ? '2px solid #2563eb'
              : '2px solid transparent',
          fontWeight: activeTab === 'RESOLVED' ? 700 : 500,
          color: activeTab === 'RESOLVED' ? '#2563eb' : '#64748b',
          cursor: 'pointer',
          fontSize: 13.5,
        }}
      >
        {t.tabResolved(
          allTickets.filter(
            (ticket) =>
              ticket.status === 'RESOLVED' || ticket.status === 'CLOSED',
          ).length,
        )}
      </button>
    </div>
  )
}
