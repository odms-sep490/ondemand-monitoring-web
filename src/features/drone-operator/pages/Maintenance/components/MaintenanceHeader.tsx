import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MaintenanceTicketDto } from '../../../api/maintenanceTicketApi'

export function MaintenanceHeader({
  myOpenCount,
  allTickets,
}: {
  myOpenCount: number
  allTickets: MaintenanceTicketDto[]
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div
      style={{
        padding: '20px 24px',
        borderRadius: 14,
        background: '#0f172a',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: '#f8fafc',
          }}
        >
          {t.headerTitle}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
          {t.headerSubtitle}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.needsAction}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>
            {myOpenCount}
          </div>
        </div>
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.totalTickets}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>
            {allTickets.length}
          </div>
        </div>
      </div>
    </div>
  )
}
