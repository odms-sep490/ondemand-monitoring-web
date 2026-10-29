import { Alert, Button, Modal } from 'antd'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { AdminAccountItem } from '../../../types/accounts'
import { resetPasswordDialogMessages } from './ResetPasswordDialog.messages'

type Props = {
  account: AdminAccountItem
  onClose: () => void
}

// TODO(BE): no reset-password endpoint exists; the confirm action stays disabled.
export function ResetPasswordDialog({ account, onClose }: Props) {
  const { t } = useI18n(resetPasswordDialogMessages)

  return (
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      width={440}
      title={t.title}
      onCancel={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t.cancel}</Button>
          <Button type="primary" disabled>
            {t.confirm}
          </Button>
        </>
      }
    >
      <p className="mgr-modal-sub">{account.email}</p>
      <p>
        {t.confirmPrefix} <strong>{account.fullName}</strong>?
      </p>
      <Alert
        type="warning"
        showIcon
        role="note"
        message={t.unsupported}
        description={t.unsupportedHint}
      />
    </Modal>
  )
}
