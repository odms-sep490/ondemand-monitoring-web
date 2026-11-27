import { useRef, useState } from 'react'
import { ApiError } from '../../../../../shared/api/httpClient'

import { useI18n } from '../../../../../shared/i18n'
import { Modal } from '../../../../../shared/components/ui'
import { readApiError } from '../../../lib/catalogMappers'
import { deleteConfirmMessages } from './DeleteConfirmModal.messages'

type Props = {
  title: string
  name: string
  description?: string
  onConfirm: () => Promise<unknown>
  onClose: () => void
  onDeleted: () => void
}

export function DeleteConfirmModal({
  title,
  name,
  description,
  onConfirm,
  onClose,
  onDeleted,
}: Props) {
  const { t } = useI18n(deleteConfirmMessages)
  const [busy, setBusy] = useState(false)
  const deleting = useRef(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (deleting.current) return
    deleting.current = true
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onDeleted()
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'SERVICE_IN_USE'
          ? t.serviceInUse
          : readApiError(err, t.genericError).message,
      )
    } finally {
      deleting.current = false
      setBusy(false)
    }
  }

  return (
    <Modal
      width={440}
      tone="danger"
      icon="shield"
      title={title}
      subtitle={name}
      onClose={() => {
        if (!deleting.current) onClose()
      }}
      footer={
        <>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            disabled={busy}
            onClick={onClose}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className="odm-btn is-danger"
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? t.processing : t.action}
          </button>
        </>
      }
    >
      <p className="adm-wrap">
        {t.confirmPrefix} <strong>{name}</strong>
        {t.confirmSuffix}
      </p>
      {description && <p className="adm-wrap">{description}</p>}
      {error && (
        <div role="alert" className="adm-alert is-danger">
          {error}
        </div>
      )}
    </Modal>
  )
}
