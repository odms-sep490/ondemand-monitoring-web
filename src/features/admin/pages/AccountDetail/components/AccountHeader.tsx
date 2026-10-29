import { EditOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ReactNode } from 'react'

import { PageHeader, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { getAccountStatusMeta } from '../../../lib/accountStatus'
import type { AdminAccountDetail } from '../../../types/accounts'
import { accountHeaderMessages } from './AccountHeader.messages'

export function AccountHeader({
  account,
  back,
  onEdit,
}: {
  account: AdminAccountDetail
  back?: ReactNode
  onEdit: () => void
}) {
  const { t, lang } = useI18n(accountHeaderMessages)
  const statusMeta = getAccountStatusMeta(account.status, lang)

  return (
    <PageHeader
      crumb={back}
      title={account.fullName}
      description={account.email}
      actions={
        <>
          <StatusTag tone={statusMeta.tone}>{statusMeta.label}</StatusTag>
          <Button icon={<EditOutlined aria-hidden="true" aria-label={undefined} />} onClick={onEdit}>
            {t.edit}
          </Button>
        </>
      }
    />
  )
}
