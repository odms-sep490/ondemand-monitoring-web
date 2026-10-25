// MNG-12 · Báo cáo

import { StateView } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { reportsApi } from '../../api/reportsApi'
import { reportsPageMessages } from './ReportsPage.messages'
import '../../manager.css'
import { ReportsData } from './components/ReportsData'
import { ReportsSkeleton } from './components/ReportsSkeleton'

// ── main page ──────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { t } = useI18n(reportsPageMessages)
  const query = useApiQuery((signal) => reportsApi.getSummary({}, signal), [])

  if (query.loading && !query.data) {
    return <ReportsSkeleton />
  }

  if (query.error) {
    return (
      <div>
        <h1
          style={{
            margin: '0 0 16px',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-.01em',
          }}
        >
          {t.pageTitle}
        </h1>
        <StateView
          state="error"
          title={t.loadError}
          error={new Error(t.loadError)}
          onRetry={query.reload}
        />
      </div>
    )
  }

  if (!query.data) {
    return (
      <div>
        <h1
          style={{
            margin: '0 0 16px',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-.01em',
          }}
        >
          {t.pageTitle}
        </h1>
        <StateView
          state="empty"
          title={t.emptyTitle}
          description={t.emptyDescription}
        />
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-.01em',
              lineHeight: 1.25,
            }}
          >
            {t.pageTitle}
          </h1>
          <div style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 3 }}>
            {t.pageSubtitle}
          </div>
        </div>
      </div>
      <ReportsData summary={query.data} t={t} />
    </div>
  )
}
