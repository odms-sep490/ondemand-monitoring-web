import { useI18n } from '../../../../../shared/i18n'
import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { ApiError } from '../../../../../shared/api/httpClient'

export function DispatchErrorState({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  const debugLine =
    error instanceof ApiError
      ? `${error.method} ${error.path}${error.status ? ` · ${error.status}` : ''}`
      : 'GET /missions/{id}'
  return (
    <div className="odm-mgr-dash">
      <div className="odm-card">
        <div className="odm-mgr-review-error">
          <div className="odm-mgr-review-error-icon" aria-hidden="true">
            !
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {t.loadMissionError}
          </div>
          <div
            className="odm-mono"
            style={{ fontSize: 11.5, color: 'var(--tx3)' }}
          >
            {debugLine}
          </div>
          <button type="button" className="odm-btn odm-btn-p" onClick={onRetry}>
            {t.retry}
          </button>
        </div>
      </div>
    </div>
  )
}
