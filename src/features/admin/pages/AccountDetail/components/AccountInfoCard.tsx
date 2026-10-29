import { Descriptions, Tag } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { fmtDate, fmtDateTime } from '../../../lib/accountStatus'
import type { AdminAccountDetail } from '../../../types/accounts'
import { accountInfoCardMessages } from './AccountInfoCard.messages'

export function AccountInfoCard({ account }: { account: AdminAccountDetail }) {
  const { t, lang } = useI18n(accountInfoCardMessages)

  return (
    <CardComponent title={t.accountInfo}>
      <Descriptions
        colon={false}
        column={{ xs: 1, sm: 2, lg: 3 }}
        layout="vertical"
        items={[
          {
            key: 'id',
            label: t.idLabel,
            children: <span className="mgr-code">{account.id}</span>,
          },
          { key: 'role', label: t.roleLabel, children: <RoleBadge role={account.role} /> },
          {
            key: 'verified',
            label: t.emailVerification,
            children: (
              <StatusTag tone={account.emailVerified ? 'success' : 'warning'}>
                {account.emailVerified ? t.verified : t.unverified}
              </StatusTag>
            ),
          },
          { key: 'created', label: t.createdAt, children: fmtDate(account.createdAt, lang) },
          {
            key: 'login',
            label: t.lastLogin,
            children: account.lastLoginAt ? fmtDateTime(account.lastLoginAt, lang) : '—',
          },
          ...(account.linkedProviders.length > 0
            ? [
                {
                  key: 'oauth',
                  label: t.oauth,
                  children: account.linkedProviders.map((p) => (
                    <Tag key={p} bordered={false}>
                      {p}
                    </Tag>
                  )),
                },
              ]
            : []),
        ]}
      />
    </CardComponent>
  )
}
