import { ThunderboltOutlined } from '@ant-design/icons'
import { Badge, Button, Empty } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { adminHref } from '../../../routes'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'
import type { DashboardAlert } from '../dashboardStats'

const SEVERITY_VAR = {
  high: 'var(--adm-red-fg)',
  medium: 'var(--adm-amber-fg)',
  low: 'var(--adm-blue-fg)',
} as const

export function AttentionCard({
  alerts,
  settled,
}: {
  alerts: DashboardAlert[]
  /** False until at least one source has answered, to avoid a flash of "all clear". */
  settled: boolean
}) {
  const { t } = useI18n(adminDashboardPageMessages)
  const a = t.attention
  return (
    <CardComponent
      title={a.title}
      icon={<ThunderboltOutlined aria-hidden="true" aria-label={undefined} />}
      tone="amber"
      extra={alerts.length > 0 ? <Badge count={alerts.length} /> : undefined}
    >
      {alerts.length === 0 ? (
        settled ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={a.empty} />
        ) : null
      ) : (
        <ul className="m-0 list-none p-0">
          {alerts.map((alert) => (
            <li key={alert.key} className="mgr-dash-row">
              <span
                className="mgr-prio"
                style={{
                  background: SEVERITY_VAR[alert.severity],
                  color: SEVERITY_VAR[alert.severity],
                }}
                aria-hidden="true"
              />
              <div className="mgr-dash-row-main">
                <div className="mgr-dash-row-title">
                  {a.items[alert.key](alert.count)}
                </div>
              </div>
              <Button size="small" href={adminHref(alert.route)}>
                {a.open}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </CardComponent>
  )
}
