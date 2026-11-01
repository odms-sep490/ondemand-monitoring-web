import { Alert, Button } from 'antd'
import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { AdminModal } from '../../../components/common/AdminModal'
import { readApiError } from '../../../lib/catalogMappers'
import { deleteConfirmMessages } from './DeleteConfirmModal.messages'

type Props = {
  title: string
  name: string
  onConfirm: () => Promise<unknown>
  onClose: () => void
  onDeleted: () => void
}

export function DeleteConfirmModal({
  title,
  name,
  onConfirm,
  onClose,
  onDeleted,
}: Props) {
  const { t } = useI18n(deleteConfirmMessages)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onDeleted()
    } catch (err) {
      setError(readApiError(err, t.genericError).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminModal
      width={440}
      tone="danger"
      title={title}
      subtitle={name}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t.cancel}</Button>
          <Button type="primary" danger onClick={handleConfirm} disabled={busy}>
            {busy ? t.processing : t.action}
          </Button>
        </>
      }
    >
      <p className="adm-wrap adm-modal-text">
        {t.confirmPrefix} <strong>{name}</strong>
        {t.confirmSuffix}
      </p>
      {error && (
        <Alert type="error" showIcon message={error} className="adm-alert" />
      )}
    </AdminModal>
  )
}
