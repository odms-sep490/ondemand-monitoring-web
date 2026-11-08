import { useEffect, useId, useState } from 'react'

import { Button, Modal } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { rejectDialogMessages } from './RejectDialog.messages'
import './RejectDialog.css'

export function RejectDialog({
  missionCode,
  submitting,
  onCancel,
  onConfirm,
}: {
  missionCode?: string
  submitting: boolean
  onCancel: () => void
  onConfirm: (reason: string, notes: string) => void
}) {
  const { t } = useI18n(rejectDialogMessages)
  const [reason, setReason] = useState(t.reasons[0])
  const [notes, setNotes] = useState('')
  const id = useId()
  const notesId = `${id}-notes`

  // Keep the selected reason valid if the language changes while the dialog
  // is open (reasons are re-translated, so re-pick the first one by default).
  useEffect(() => {
    if (!t.reasons.includes(reason)) setReason(t.reasons[0])
  }, [t.reasons])

  return (
    <Modal
      title={t.title}
      subtitle={t.description}
      tone="danger"
      icon="shield"
      width={520}
      onClose={() => {
        if (!submitting) onCancel()
      }}
      footer={
        <>
          <Button variant="ghost" disabled={submitting} onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button
            variant="danger"
            loading={submitting}
            disabled={submitting}
            onClick={() => onConfirm(reason, notes)}
          >
            {submitting ? t.submitting : t.submit}
          </Button>
        </>
      }
    >
      <div className="odm-reject-dialog">
        <div className="odm-reject-code">
          <span className="odm-reject-code-label">{t.missionCodeLabel}</span>
          <span className="odm-reject-code-value">
            {missionCode?.trim() || t.missionCodeUnavailable}
          </span>
        </div>

        <fieldset className="odm-reject-reasons" disabled={submitting}>
          <legend>{t.reasonLabel}</legend>
          <div className="odm-reject-options">
            {t.reasons.map((item) => (
              <label
                key={item}
                className={`odm-reject-option${reason === item ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`${id}-reason`}
                  value={item}
                  checked={reason === item}
                  onChange={() => setReason(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="odm-reject-notes-field">
          <label className="ui-label" htmlFor={notesId}>
            {t.notesLabel}
          </label>
          <textarea
            id={notesId}
            className="odm-reject-notes"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t.notesPlaceholder}
            disabled={submitting}
          />
        </div>
      </div>
    </Modal>
  )
}
