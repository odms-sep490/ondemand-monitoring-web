import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'

type Props = {
  unassignedCount: number
  urgentCount: number
  resolvedCount: number
}

/** Three small counters shown at the right of the page header. */
export function MaintenanceStats({ unassignedCount, urgentCount, resolvedCount }: Props) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div className="mgr-maint-stats">
      <div className={`mgr-maint-stat${unassignedCount > 0 ? ' is-red' : ''}`}>
        <div className="mgr-maint-stat-label">{t.page.unassignedStat}</div>
        <div className="mgr-maint-stat-value">{unassignedCount}</div>
      </div>
      <div className="mgr-maint-stat is-amber">
        <div className="mgr-maint-stat-label">{t.page.urgentStat}</div>
        <div className="mgr-maint-stat-value">{urgentCount}</div>
      </div>
      <div className="mgr-maint-stat is-green">
        <div className="mgr-maint-stat-label">{t.page.resolvedStat}</div>
        <div className="mgr-maint-stat-value">{resolvedCount}</div>
      </div>
    </div>
  )
}
