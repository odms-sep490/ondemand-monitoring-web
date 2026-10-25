import { StateView } from '../../../../../shared/components/odm/StateView'
import { ApiError } from '../../../../../shared/api/httpClient'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { MaintenanceTicket } from '../../../types/maintenance'

export function MaintenanceLoadError({
  query,
}: {
  query: UseApiQueryState<{ items: MaintenanceTicket[]; total: number }>
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div style={{ padding: 24 }}>
      <StateView
        state="error"
        title={t.page.loadError}
        error={query.error}
        onRetry={query.reload}
      />
      {query.error instanceof ApiError && (
        <code
          className="odm-mono"
          style={{
            display: 'block',
            fontSize: 11,
            color: 'var(--tx3)',
            marginTop: 8,
          }}
        >
          GET /api/maintenance-tickets · {query.error.status ?? '—'}
        </code>
      )}
    </div>
  )
}
