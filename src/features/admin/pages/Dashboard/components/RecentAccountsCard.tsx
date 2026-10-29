import { Avatar, List } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { MockDataTag } from '../../../components/common/MockDataTag'
import { fmtDate, getAccountStatusMeta } from '../../../lib/accountStatus'
import { adminHref } from '../../../routes'
import type { AdminAccountItem } from '../../../types/accounts'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'

/** Latest accounts: still backed by the mock dashboard endpoint. */
export function RecentAccountsCard({ accounts }: { accounts: AdminAccountItem[] }) {
  const { t, lang } = useI18n(adminDashboardPageMessages)
  return (
    <CardComponent
      title={
        <span className="adm-card-title">
          <h3 className="mgr-card-title">{t.latestAccounts}</h3>
          <MockDataTag />
        </span>
      }
      extra={<a href={adminHref({ screen: 'accounts' })}>{t.viewAll}</a>}
    >
      <List
        dataSource={accounts}
        rowKey="id"
        renderItem={(acc) => {
          const meta = getAccountStatusMeta(acc.status, lang)
          return (
            <List.Item extra={<StatusTag tone={meta.tone}>{meta.label}</StatusTag>}>
              <List.Item.Meta
                avatar={
                  <Avatar aria-hidden="true">{(acc.fullName[0] ?? '?').toUpperCase()}</Avatar>
                }
                title={
                  <a href={adminHref({ screen: 'accountDetail', accountId: acc.id })}>
                    {acc.fullName}
                  </a>
                }
                description={fmtDate(acc.createdAt, lang)}
              />
            </List.Item>
          )
        }}
      />
    </CardComponent>
  )
}
