import { Alert, Button } from 'antd'
import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { adminUsersApi } from '../../../api/adminUsersApi'
import { AdminModal } from '../../../components/common/AdminModal'
import type { AdminAccountItem } from '../../../types/accounts'
import { lockAccountDialogMessages } from './LockAccountDialog.messages'

type Props = {
  account: AdminAccountItem
  onClose: () => void
  onSuccess: () => void
}

export function LockAccountDialog({ account, onClose, onSuccess }: Props) {
  const { t } = useI18n(lockAccountDialogMessages)
  const isLocked = account.status === 'INACTIVE'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await adminUsersApi.updateUserStatus(account.id, { active: isLocked })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminModal
      width={440}
      tone={isLocked ? 'success' : 'danger'}
      title={isLocked ? t.unlockTitle : t.lockTitle}
      subtitle={account.email}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t.cancel}</Button>
          <Button
            type="primary"
            danger={!isLocked}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? t.processing : isLocked ? t.unlockAction : t.lockAction}
          </Button>
        </>
      }
    >
      <p className="adm-modal-text">
        {isLocked ? t.unlockConfirmPrefix : t.lockConfirmPrefix}{' '}
        <strong>{account.fullName}</strong>
        {isLocked ? t.unlockConfirmSuffix : t.lockConfirmSuffix}
      </p>
      {!isLocked && (
        <Alert
          type="warning"
          showIcon
          message={t.lockWarning}
          className="adm-alert"
        />
      )}
      {error && (
        <Alert type="error" showIcon message={error} className="adm-alert" />
      )}
    </AdminModal>
  )
}
