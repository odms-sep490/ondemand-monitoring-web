import { useState } from 'react'
import { Alert, Button, Modal, Select } from 'antd'

import { useToast } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { getDroneStatusLabel } from '../../../../../shared/lib/statusTone'
import type { DroneStatus } from '../../../../../shared/types/domain'
import { mgrPopupContainer } from '../../../components/common/mgrPopupContainer'
import { dronesApi } from '../../../api/dronesApi'
import { managerFeedbackMessages } from '../../../feedback.messages'
import type { DeviceResponse } from '../../../types/drones'
import { MANUAL_TRANSITIONS } from '../droneHelpers'
import { dronesPageMessages } from '../DronesPage.messages'
import { DroneStatusTag } from './DroneStatusTag'

export type StatusChangeModalProps = {
  drone: DeviceResponse
  onClose: () => void
  onChanged: (updated: DeviceResponse) => void
}

export function StatusChangeModal({ drone, onClose, onChanged }: StatusChangeModalProps) {
  const { t, lang } = useI18n(dronesPageMessages)
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const nextStatuses = MANUAL_TRANSITIONS[drone.status] ?? []
  const [selectedStatus, setSelectedStatus] = useState<DroneStatus | ''>(nextStatuses[0] ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!selectedStatus) return
    setSaving(true)
    setError(null)
    try {
      const updated = await dronesApi.updateDrone(drone.id, {
        serialNumber: drone.serialNumber,
        // Always send the full body so a PUT cannot clear name/model.
        // Null source values fall back to undefined (nothing to preserve).
        name: drone.name ?? undefined,
        modelId: drone.deviceModel?.id,
        status: selectedStatus,
      })
      toast.success(fb.droneUpdated)
      onChanged(updated)
    } catch (e) {
      const failure = e instanceof Error ? e.message : t.unknownError
      setError(failure)
      toast.error(failure)
    } finally {
      setSaving(false)
    }
  }

  const canSave = nextStatuses.length > 0
  const model = drone.deviceModel?.modelName ?? ''
  return (
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      width={440}
      title={t.modal.title}
      onCancel={onClose}
      footer={
        canSave ? (
          <>
            <Button onClick={onClose} disabled={saving}>
              {t.modal.cancel}
            </Button>
            <Button type="primary" onClick={handleSave} disabled={saving || !selectedStatus}>
              {saving ? t.modal.saving : t.modal.confirm}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>{t.modal.close}</Button>
        )
      }
    >
      <p className="mgr-modal-sub">{t.modal.subtitle(drone.serialNumber, model)}</p>
      {canSave ? (
        <div className="mgr-modal-stack">
          <div className="mgr-modal-field">
            <span className="mgr-modal-label">{t.modal.current}</span>
            <DroneStatusTag status={drone.status} />
          </div>
          <div className="mgr-modal-field">
            <label className="mgr-modal-label" htmlFor="drone-new-status">
              {t.modal.newStatus} <span aria-hidden="true">*</span>
            </label>
            <Select
              id="drone-new-status"
              value={selectedStatus || undefined}
              onChange={(value: DroneStatus) => setSelectedStatus(value)}
              options={nextStatuses.map((s) => ({ value: s, label: getDroneStatusLabel(s, lang) }))}
            />
          </div>
          {error ? <Alert type="error" showIcon role="alert" message={error} /> : null}
        </div>
      ) : (
        <p>{t.modal.cannotChange(getDroneStatusLabel(drone.status, lang))}</p>
      )}
    </Modal>
  )
}
