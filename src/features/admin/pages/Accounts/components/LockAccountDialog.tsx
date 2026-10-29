import { Alert, Button, Modal } from 'antd'
import { useState } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { adminUsersApi } from '../../../api/adminUsersApi'
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
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      width={440}
      title={isLocked ? t.unlockTitle : t.lockTitle}
      onCancel={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t.cancel}</Button>
          <Button type="primary" danger={!isLocked} onClick={handleConfirm} loading={loading}>
            {loading ? t.processing : isLocked ? t.unlockAction : t.lockAction}
          </Button>
        </>
      }
    >
      <p className="mgr-modal-sub">{account.email}</p>
      <p>
        {isLocked ? t.unlockConfirmPrefix : t.lockConfirmPrefix}{' '}
        <strong>{account.fullName}</strong>
        {isLocked ? t.unlockConfirmSuffix : t.lockConfirmSuffix}
      </p>
      {!isLocked && <Alert type="warning" showIcon message={t.lockWarning} />}
      {error && <Alert type="error" showIcon role="alert" message={error} className="adm-modal-gap" />}
    </Modal>
  )
}
