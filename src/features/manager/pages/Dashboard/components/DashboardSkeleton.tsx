import { Card, Skeleton } from 'antd'

import type { PageMessages } from '../dashboardTypes'

export function DashboardSkeleton({ t }: { t: PageMessages }) {
  return (
    <div className="mgr-dash" aria-busy="true" aria-live="polite">
      <header className="mgr-dash-header mgr-hero-skeleton">
        <div>
          <Skeleton.Input active style={{ width: 250 }} />
          <Skeleton active paragraph={{ rows: 1 }} />
        </div>
        <Skeleton.Button active />
      </header>
      <div className="mgr-kpi-grid" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="mgr-dash-kpi"><Skeleton active paragraph={{ rows: 1 }} /></div>
        ))}
      </div>
      <div className="mgr-columns">
        <div className="mgr-stack">
          <Card className="mgr-card"><Skeleton active paragraph={{ rows: 5 }} /></Card>
          <Card className="mgr-card"><Skeleton active paragraph={{ rows: 3 }} /></Card>
        </div>
        <div className="mgr-stack">
          <Card className="mgr-card"><Skeleton active paragraph={{ rows: 4 }} /></Card>
          <Card className="mgr-card"><Skeleton active paragraph={{ rows: 3 }} /></Card>
          <Card className="mgr-card"><Skeleton active paragraph={{ rows: 3 }} /></Card>
        </div>
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
