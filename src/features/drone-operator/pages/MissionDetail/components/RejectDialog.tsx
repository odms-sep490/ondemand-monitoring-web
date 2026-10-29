import { Button, Input, Modal, Radio } from 'antd'
import { useEffect, useState } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { rejectDialogMessages } from './RejectDialog.messages'

export function RejectDialog({
  missionId,
  submitting,
  onCancel,
  onConfirm,
}: {
  missionId: string
  submitting: boolean
  onCancel: () => void
  onConfirm: (reason: string, notes: string) => void
}) {
  const { t } = useI18n(rejectDialogMessages)
  const [reason, setReason] = useState(t.reasons[0])
  const [notes, setNotes] = useState('')

  // Keep the selected reason valid if the language changes while the dialog
  // is open (reasons are re-translated, so re-pick the first one by default).
  useEffect(() => {
    if (!t.reasons.includes(reason)) setReason(t.reasons[0])
  }, [t.reasons])

  return (
    <Modal
      open
      centered
      width={460}
      title={t.title(missionId)}
      onCancel={submitting ? undefined : onCancel}
      getContainer={mgrPopupContainer}
      footer={
        <>
          <Button onClick={onCancel} disabled={submitting}>
            {t.cancel}
          </Button>
          <Button
            danger
            type="primary"
            onClick={() => onConfirm(reason, notes)}
            disabled={submitting}
            loading={submitting}
          >
            {submitting ? t.submitting : t.submit}
          </Button>
        </>
      }
    >
      <p className="stf-muted" style={{ marginTop: 0 }}>
        {t.description}
      </p>
      <Radio.Group
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {t.reasons.map((r) => (
          <Radio key={r} value={r}>
            {r}
          </Radio>
        ))}
      </Radio.Group>
      <div style={{ marginTop: 14 }}>
        <label
          htmlFor="reject-notes"
          className="stf-muted"
          style={{ display: 'block', marginBottom: 6, fontSize: 13 }}
        >
          {t.notesLabel}
        </label>
        <Input.TextArea
          id="reject-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPlaceholder}
        />
      </div>
    </Modal>
  )
}
