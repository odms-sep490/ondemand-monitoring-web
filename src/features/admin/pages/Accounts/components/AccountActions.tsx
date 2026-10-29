import { EyeOutlined, KeyOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { AdminAccountItem } from '../../../types/accounts'
import { accountActionsMessages } from './AccountActions.messages'

export function AccountActions({
  account,
  onEdit,
  onLock,
  onResetPassword,
}: {
  account: AdminAccountItem
  onEdit: () => void
  onLock: () => void
  onResetPassword: () => void
}) {
  const { t } = useI18n(accountActionsMessages)
  const locked = account.status === 'INACTIVE'
  const lockLabel = locked ? t.unlock : t.lock

  return (
    <Space size={4} className="odm-adm-account-actions">
      <Button
        type="text"
        size="small"
        icon={<EyeOutlined aria-hidden="true" aria-label={undefined} />}
        onClick={onEdit}
        aria-label={t.edit}
        title={t.edit}
      />
      <Button
        type="text"
        size="small"
        danger={!locked}
        icon={locked ? <UnlockOutlined aria-hidden="true" aria-label={undefined} /> : <LockOutlined aria-hidden="true" aria-label={undefined} />}
        onClick={onLock}
        aria-label={lockLabel}
        title={lockLabel}
      />
      <Button
        type="text"
        size="small"
        icon={<KeyOutlined aria-hidden="true" aria-label={undefined} />}
        onClick={onResetPassword}
        aria-label={t.resetPassword}
        title={t.resetPassword}
      />
    </Space>
  )
}
