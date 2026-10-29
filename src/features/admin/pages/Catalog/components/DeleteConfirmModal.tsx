import { Alert, Button, Modal } from 'antd'
import { useState } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { readApiError } from '../../../lib/catalogMappers'
import { deleteConfirmMessages } from './DeleteConfirmModal.messages'

type Props = {
  title: string
  name: string
  onConfirm: () => Promise<unknown>
  onClose: () => void
  onDeleted: () => void
}

export function DeleteConfirmModal({ title, name, onConfirm, onClose, onDeleted }: Props) {
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
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      width={440}
      title={title}
      onCancel={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t.cancel}</Button>
          <Button type="primary" danger onClick={handleConfirm} loading={busy}>
            {busy ? t.processing : t.action}
          </Button>
        </>
      }
    >
      <p className="mgr-modal-sub">{name}</p>
      <p className="adm-wrap">
        {t.confirmPrefix} <strong>{name}</strong>
        {t.confirmSuffix}
      </p>
      {error && <Alert type="error" showIcon role="alert" message={error} />}
    </Modal>
  )
}
