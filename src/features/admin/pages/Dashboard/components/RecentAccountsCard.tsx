import { UserOutlined } from '@ant-design/icons'
import { Empty, Tag } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { fmtDateTime } from '../../../lib/accountStatus'
import { adminHref } from '../../../routes'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'
import type { RecentAccounts } from '../dashboardData'
import { pickRecent } from '../dashboardStats'
import { QueryBody } from './QueryBody'

const ROWS = 5

export function RecentAccountsCard({
  recent,
}: {
  recent: UseApiQueryState<RecentAccounts>
}) {
  const { t, lang } = useI18n(adminDashboardPageMessages)
  const r = t.recent
  return (
    <CardComponent
      title={r.title}
      icon={<UserOutlined aria-hidden="true" aria-label={undefined} />}
      tone="blue"
      extra={
        <a className="mgr-card-link" href={adminHref({ screen: 'accounts' })}>
          {r.viewAll}
        </a>
      }
    >
      <QueryBody query={recent}>
        {(data) =>
          data.items.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={r.empty} />
          ) : (
            <ul className="m-0 list-none p-0">
              {pickRecent(data.items, ROWS).map((u) => (
                <li key={u.id}>
                  <a
                    className="mgr-dash-row mgr-dash-row-link"
                    href={adminHref({
                      screen: 'accountDetail',
                      accountId: u.id,
                    })}
                  >
                    <div className="mgr-dash-row-main">
                      <div className="mgr-dash-row-title">{u.fullName}</div>
                      <div className="mgr-dash-row-meta">
                        {u.email} · {fmtDateTime(u.createdAt, lang)}
                      </div>
                    </div>
                    {u.active ? null : <Tag bordered={false}>{r.locked}</Tag>}
                    <RoleBadge role={u.role} />
                  </a>
                </li>
              ))}
            </ul>
          )
        }
      </QueryBody>
    </CardComponent>
  )
}
