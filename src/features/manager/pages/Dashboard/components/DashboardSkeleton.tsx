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
            <Skeleton.Avatar active shape="square" size={48} />
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
          className="mgr-card mgr-active-missions-card"
          title={<Skeleton.Input active size="small" style={{ width: 168 }} />}
        >
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
        <Card
          className="mgr-card mgr-activity-card"
          title={<Skeleton.Input active size="small" style={{ width: 150 }} />}
        >
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <Card
          className="mgr-card mgr-pipeline-card"
          title={<Skeleton.Input active size="small" style={{ width: 132 }} />}
        >
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
        <Card
          className="mgr-card mgr-recent-orders-card"
          title={<Skeleton.Input active size="small" style={{ width: 126 }} />}
        >
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </div>
      <section className="mgr-analytics" aria-hidden="true">
        <div className="mgr-analytics-heading">
          <Skeleton.Input active size="small" style={{ width: 110 }} />
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
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
