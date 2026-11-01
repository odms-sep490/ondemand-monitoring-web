import { IdcardOutlined } from '@ant-design/icons'
import { Descriptions } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { fmtDate, fmtDateTime } from '../../../lib/accountStatus'
import type { AdminAccountDetail } from '../../../types/accounts'
import { accountInfoCardMessages } from './AccountInfoCard.messages'

export function AccountInfoCard({ account }: { account: AdminAccountDetail }) {
  const { t, lang } = useI18n(accountInfoCardMessages)

  return (
    <CardComponent
      title={t.accountInfo}
      icon={<IdcardOutlined aria-hidden="true" aria-label={undefined} />}
    >
      <Descriptions
        column={{ xs: 1, sm: 2 }}
        layout="vertical"
        className="adm-descriptions"
      >
        <Descriptions.Item label={t.idLabel}>
          <span className="adm-mono adm-wrap">{account.id}</span>
        </Descriptions.Item>
        <Descriptions.Item label={t.roleLabel}>
          <RoleBadge role={account.role} />
        </Descriptions.Item>
        <Descriptions.Item label={t.emailVerification}>
          <StatusTag tone={account.emailVerified ? 'success' : 'warning'}>
            {account.emailVerified ? t.verified : t.unverified}
          </StatusTag>
        </Descriptions.Item>
        <Descriptions.Item label={t.createdAt}>
          <span className="adm-mono">{fmtDate(account.createdAt, lang)}</span>
        </Descriptions.Item>
        <Descriptions.Item label={t.lastLogin}>
          <span className="adm-mono">
            {account.lastLoginAt ? fmtDateTime(account.lastLoginAt, lang) : '—'}
          </span>
        </Descriptions.Item>
        {account.linkedProviders.length > 0 && (
          <Descriptions.Item label={t.oauth}>
            {account.linkedProviders.join(', ')}
          </Descriptions.Item>
        )}
      </Descriptions>
    </CardComponent>
  )
}
