import { Button } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import { AdminModal } from '../../components/common/AdminModal'
import type { ServiceChecklist } from '../../api/checklistsApi'
import { checklistMessages } from './checklists.messages'

export function RemoveChecklistModal({
  row,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  row: ServiceChecklist
  busy: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useI18n(checklistMessages)
  return (
    <AdminModal
      title={t.removeTitle}
      tone="danger"
      onClose={() => {
        if (!busy) onCancel()
      }}
      footer={
        <>
          <Button disabled={busy} onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button type="primary" danger disabled={busy} onClick={onConfirm}>
            {busy ? t.saving : t.remove}
          </Button>
        </>
      }
    >
      <div className="checklist-dialog">
        <p>{t.removeConfirm}</p>
        <div className="checklist-danger-summary">{row.content}</div>
        {error && <p role="alert">{error}</p>}
      </div>
    </AdminModal>
  )
}
