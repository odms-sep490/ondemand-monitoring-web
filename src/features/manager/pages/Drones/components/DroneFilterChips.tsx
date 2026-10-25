import { StateView } from '../../../../../shared/components/odm/StateView'
import { ApiError } from '../../../../../shared/api/httpClient'
import { dronesPageMessages } from '../DronesPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { PageResponseDroneResponse } from '../../../types/drones'

export function DroneFilterChips({
  query,
}: {
  query: UseApiQueryState<PageResponseDroneResponse>
}) {
  const { t } = useI18n(dronesPageMessages)
  return (
    <div style={{ padding: 24 }}>
      <StateView
        state="error"
        title={t.loadError}
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
          GET /api/drones · {query.error.status ?? '—'}
        </code>
      )}
    </div>
  )
}
