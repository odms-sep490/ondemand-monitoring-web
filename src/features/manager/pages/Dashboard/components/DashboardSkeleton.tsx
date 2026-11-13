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
          <div key={i} className="mgr-dash-kpi mgr-dash-kpi-loading">
            <div className="mgr-kpi-skeleton-copy">
              <Skeleton.Input
                active
                size="small"
                style={{ width: 112, height: 13 }}
              />
              <Skeleton.Input
                active
                size="small"
                style={{ width: 40, height: 27 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mgr-dash-columns">
        <Card
          className="mgr-card mgr-action-card"
          title={<Skeleton.Input active size="small" style={{ width: 144 }} />}
        >
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <Card
          className="mgr-card mgr-mission-status-card"
          title={<Skeleton.Input active size="small" style={{ width: 150 }} />}
        >
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
        <Card
          className="mgr-card mgr-mission-trend-card"
          title={<Skeleton.Input active size="small" style={{ width: 170 }} />}
        >
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
        <Card
          className="mgr-card mgr-recent-orders-card"
          title={<Skeleton.Input active size="small" style={{ width: 126 }} />}
        >
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
        <Card
          className="mgr-card mgr-pipeline-card"
          title={<Skeleton.Input active size="small" style={{ width: 132 }} />}
        >
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <Card
          className="mgr-card mgr-activity-card"
          title={<Skeleton.Input active size="small" style={{ width: 150 }} />}
        >
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <section className="mgr-analytics" aria-hidden="true">
          <div className="mgr-analytics-heading">
            <Skeleton.Input active size="small" style={{ width: 148 }} />
          </div>
          <div className="mgr-analytics-list">
            <Card className="mgr-card">
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
            <Card className="mgr-card">
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          </div>
        </section>
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
