import { useState } from 'react'
import { Alert, Avatar, Button, Modal, Radio } from 'antd'

import { useToast } from '../../../../../shared/components/ui'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { maintenanceApi } from '../../../api/maintenanceApi'
import { mgrPopupContainer } from '../../../components/common/mgrPopupContainer'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { maintenancePageMessages } from '../MaintenancePage.messages'

export function AssignModal({
  ticket,
  onClose,
  onAssigned,
}: {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssigned: (ticket: MaintenanceTicket) => void
}) {
  const { t } = useI18n(maintenancePageMessages)
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const staffQuery = useApiQuery((signal) => maintenanceApi.listAssignableStaff(signal), [])
  const [techId, setTechId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const staffList = staffQuery.data ?? []

  async function handleAssign() {
    if (!techId) return
    setSaving(true)
    setError(null)
    try {
      const updated = await maintenanceApi.assignTechnician(ticket.id, techId)
      toast.success(fb.technicianAssigned)
      onAssigned(updated)
    } catch (e) {
      const failure = e instanceof Error ? e.message : t.assignModal.failed
      setError(failure)
      toast.error(failure)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      centered
      width={500}
      getContainer={mgrPopupContainer}
      title={t.assignModal.title}
      onCancel={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            {t.assignModal.cancel}
          </Button>
          <Button type="primary" onClick={handleAssign} disabled={saving || !techId}>
            {saving ? t.assignModal.assigning : t.assignModal.confirm}
          </Button>
        </>
      }
    >
      <div className="mgr-assign-ticket">
        <div>
          {t.assignModal.ticketLabel}
          <b className="mgr-code">{ticket.code}</b>
          {t.assignModal.droneLabel}
          <b>{ticket.droneCode}</b>
        </div>
        <div className="mgr-cell-sub">{formatTicketTitle(ticket.title)}</div>
      </div>

      <div className="mgr-assign-label" id="assign-operator-label">
        {t.assignModal.chooseOperator}
      </div>

      {staffQuery.loading && (
        <div className="mgr-cell-sub" aria-busy="true">
          {t.assignModal.loadingStaff}
        </div>
      )}
      {!staffQuery.loading && !!staffQuery.error && (
        <Alert
          type="error"
          showIcon
          role="alert"
          message={t.assignModal.staffLoadError}
          action={
            <Button size="small" onClick={staffQuery.reload}>
              {t.assignModal.retry}
            </Button>
          }
        />
      )}
      {!staffQuery.loading && !staffQuery.error && staffList.length === 0 && (
        <div className="mgr-cell-sub">{t.assignModal.noStaff}</div>
      )}

      <Radio.Group
        className="mgr-assign-list"
        aria-labelledby="assign-operator-label"
        value={techId}
        onChange={(event) => setTechId(event.target.value)}
      >
        {staffList.map((op) => (
          <Radio key={op.id} value={op.id} className={`mgr-assign-item${techId === op.id ? ' is-selected' : ''}`}>
            <span className="mgr-cust">
              <Avatar size={34} className="mgr-cust-avatar" aria-hidden="true">
                {op.fullName.charAt(0)}
              </Avatar>
              <span className="mgr-cell-stack">
                <span>{op.fullName}</span>
                <span className="mgr-cell-sub">{op.email}</span>
              </span>
            </span>
          </Radio>
        ))}
      </Radio.Group>

      {error ? <Alert type="error" showIcon role="alert" message={error} className="mgr-assign-error" /> : null}
    </Modal>
  )
}
