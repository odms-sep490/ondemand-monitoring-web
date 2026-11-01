import { Alert, Button } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { AdminModal } from '../../../components/common/AdminModal'
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
    <AdminModal
      width={440}
      tone="warning"
      title={t.title}
      subtitle={account.email}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t.cancel}</Button>
          <Button type="primary" disabled>
            {t.confirm}
          </Button>
        </>
      }
    >
      <p className="adm-modal-text">
        {t.confirmPrefix} <strong>{account.fullName}</strong>?
      </p>
      <Alert
        type="warning"
        showIcon
        role="note"
        className="adm-alert"
        message={t.unsupported}
        description={t.unsupportedHint}
      />
    </AdminModal>
  )
}
