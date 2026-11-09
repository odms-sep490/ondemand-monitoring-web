import { useState } from 'react'

import { Button } from '../../../../../shared/components/ui/Button'
import { Modal } from '../../../../../shared/components/ui/Modal'
import { useI18n } from '../../../../../shared/i18n'
import { cancelMissionDialogMessages } from './CancelMissionDialog.messages'

export function CancelMissionDialog({
  missionCode,
  busy,
  onClose,
  onConfirm,
}: {
  missionCode: string
  busy: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const { t } = useI18n(cancelMissionDialogMessages)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  async function handleConfirm() {
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      setError(t.reasonRequired)
      return
    }

    setError('')
    try {
      await onConfirm(trimmedReason)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.cancelFailed)
    }
  }

  return (
    <Modal
      title={t.title(missionCode)}
      subtitle={t.description}
      icon="trash"
      tone="danger"
      width={500}
      onClose={() => {
        if (!busy) onClose()
      }}
      footer={
        <>
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            {t.keepMission}
          </Button>
          <Button
            variant="danger"
            loading={busy}
            disabled={!reason.trim()}
            onClick={() => void handleConfirm()}
          >
            {t.confirmCancel}
          </Button>
        </>
      }
    >
      <div className="mds-cancel-form">
        <label className="ui-label" htmlFor="mission-cancel-reason">
          {t.reasonLabel}
        </label>
        <textarea
          id="mission-cancel-reason"
          className="odm-input"
          rows={4}
          maxLength={1000}
          autoFocus
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t.reasonPlaceholder}
          disabled={busy}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'mission-cancel-error' : undefined}
        />
      </div>
      {error && (
        <p id="mission-cancel-error" className="mds-cancel-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  )
}
