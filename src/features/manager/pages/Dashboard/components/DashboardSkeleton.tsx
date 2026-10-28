import { Card, Col, Row, Skeleton } from 'antd'

import type { PageMessages } from '../dashboardTypes'

export function DashboardSkeleton({ t }: { t: PageMessages }) {
  return (
    <div className="mgr-dash" aria-busy="true" aria-live="polite">
      <div className="mgr-hero mgr-hero-skeleton">
        <Skeleton.Input active style={{ width: 260 }} />
      </div>
      <div className="mgr-kpi-grid">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} className="mgr-card"><Skeleton active paragraph={{ rows: 1 }} /></Card>
        ))}
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card className="mgr-card"><Skeleton active paragraph={{ rows: 5 }} /></Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card className="mgr-card"><Skeleton active paragraph={{ rows: 5 }} /></Card>
        </Col>
      </Row>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
