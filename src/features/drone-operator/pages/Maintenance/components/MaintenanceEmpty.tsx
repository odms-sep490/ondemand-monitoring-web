import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'

export function MaintenanceEmpty() {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div
      className="odm-card"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: '#94a3b8',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 15,
          color: '#1e293b',
          fontWeight: 600,
        }}
      >
        {t.emptyTitle}
      </h3>
      <p style={{ margin: '4px 0 0', fontSize: 13 }}>{t.emptyBody}</p>
    </div>
  )
}
