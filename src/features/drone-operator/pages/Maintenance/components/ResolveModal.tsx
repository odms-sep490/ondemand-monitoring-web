import { Alert, Button, Input, Modal, Select } from 'antd'
import type { Dispatch, SetStateAction } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { formatTicketDescription } from '../../../../manager/lib/ticketText'
import type { MaintenanceTicketDto } from '../../../api/maintenanceTicketApi'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { maintenanceDeviceLabel } from '../maintenanceHelpers'

export function ResolveModal({
  setSelectedTicket,
  selectedTicket,
  notes,
  setNotes,
  targetDroneStatus,
  setTargetDroneStatus,
  error,
  saving,
  handleResolveSubmit,
}: {
  setSelectedTicket: Dispatch<SetStateAction<MaintenanceTicketDto | null>>
  selectedTicket: MaintenanceTicketDto
  notes: string
  setNotes: Dispatch<SetStateAction<string>>
  targetDroneStatus: string
  setTargetDroneStatus: Dispatch<SetStateAction<string>>
  error: string | null
  saving: boolean
  handleResolveSubmit: () => Promise<void>
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <Modal
      open
      centered
      width={520}
      title={t.modalTitle}
      getContainer={mgrPopupContainer}
      onCancel={() => setSelectedTicket(null)}
      footer={
        <>
          <Button onClick={() => setSelectedTicket(null)} disabled={saving}>
            {t.cancel}
          </Button>
          <Button
            type="primary"
            onClick={handleResolveSubmit}
            disabled={saving}
            loading={saving}
          >
            {saving ? t.processing : t.confirmRestore}
          </Button>
        </>
      }
    >
      <div className="stf-stack-sm">
        <div className="stf-metric" style={{ fontSize: 13 }}>
          <div>
            {t.modalTicketPrefix}{' '}
            <b className="stf-mono">{selectedTicket.ticketCode}</b> ·{' '}
            {t.modalDronePrefix} <b>{maintenanceDeviceLabel(selectedTicket)}</b>
          </div>
          <div
            className="stf-muted"
            style={{ marginTop: 2, whiteSpace: 'pre-line' }}
          >
            {formatTicketDescription(selectedTicket.description ?? '')}
          </div>
        </div>

        <div>
          <label
            htmlFor="resolve-notes"
            style={{
              display: 'block',
              marginBottom: 6,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {t.notesLabel}
          </label>
          <Input.TextArea
            id="resolve-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.notesPlaceholder}
          />
        </div>

        <div>
          <label
            htmlFor="resolve-status"
            style={{
              display: 'block',
              marginBottom: 6,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {t.droneStatusLabel}
          </label>
          <Select
            id="resolve-status"
            style={{ width: '100%' }}
            value={targetDroneStatus}
            onChange={(value) => setTargetDroneStatus(value)}
            options={(
              ['AVAILABLE', 'IDLE_CHARGING', 'MAINTENANCE'] as const
            ).map((value) => ({ value, label: t.droneStatusOptions[value] }))}
          />
        </div>

        {error && <Alert type="error" showIcon message={error} />}
      </div>
    </Modal>
  )
}
