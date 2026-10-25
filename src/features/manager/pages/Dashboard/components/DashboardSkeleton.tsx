import type { PageMessages } from '../dashboardTypes'

export function DashboardSkeleton({ t }: { t: PageMessages }) {
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <div className="odm-mgr-kpi-row">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="odm-card odm-mgr-kpi-sk" key={index}>
            <span className="odm-sk" style={{ width: '65%', height: 12 }} />
            <span className="odm-sk" style={{ width: '35%', height: 28 }} />
            <span className="odm-sk" style={{ width: '80%', height: 10 }} />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div className="odm-card odm-mgr-chart-sk" key={index}>
          <span className="odm-sk" style={{ width: '100%', height: 150 }} />
        </div>
      ))}
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
