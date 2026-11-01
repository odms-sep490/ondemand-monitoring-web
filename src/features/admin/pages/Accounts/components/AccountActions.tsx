import {
  KeyOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { Button, Space, Tooltip } from 'antd'

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
    <Space size={4} className="adm-row-actions">
      <Tooltip title={t.edit}>
        <Button
          type="text"
          shape="circle"
          className="adm-action-btn is-info"
          icon={<EyeOutlined aria-hidden="true" aria-label={undefined} />}
          onClick={onEdit}
          aria-label={t.edit}
        />
      </Tooltip>
      <Tooltip title={lockLabel}>
        <Button
          type="text"
          shape="circle"
          className={`adm-action-btn ${locked ? 'is-success' : 'is-danger'}`}
          icon={
            locked ? (
              <UnlockOutlined aria-hidden="true" aria-label={undefined} />
            ) : (
              <LockOutlined aria-hidden="true" aria-label={undefined} />
            )
          }
          onClick={onLock}
          aria-label={lockLabel}
        />
      </Tooltip>
      <Tooltip title={t.resetPassword}>
        <Button
          type="text"
          shape="circle"
          className="adm-action-btn is-warning"
          icon={<KeyOutlined aria-hidden="true" aria-label={undefined} />}
          onClick={onResetPassword}
          aria-label={t.resetPassword}
        />
      </Tooltip>
    </Space>
  )
}
