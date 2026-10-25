import type { DroneResponse } from '../../../types/drones'
import { useI18n } from '../../../../../shared/i18n'
import { dronesPageMessages } from '../DronesPage.messages'
import { MANUAL_TRANSITIONS } from '../droneHelpers'
import { useState } from 'react'
import type { DroneStatus } from '../../../../../shared/types/domain'
import { dronesApi } from '../../../api/dronesApi'
import { getDroneStatusLabel } from '../../../../../shared/lib/statusTone'

export type StatusChangeModalProps = {
  drone: DroneResponse
  onClose: () => void
  onChanged: (updated: DroneResponse) => void
}

export function StatusChangeModal({
  drone,
  onClose,
  onChanged,
}: StatusChangeModalProps) {
  const { t, lang } = useI18n(dronesPageMessages)
  const nextStatuses = MANUAL_TRANSITIONS[drone.status] ?? []
  const [selectedStatus, setSelectedStatus] = useState<DroneStatus | ''>(
    nextStatuses[0] ?? '',
  )
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!selectedStatus) return
    if (!reason.trim()) {
      setError(t.modal.reasonRequired)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await dronesApi.updateDrone(drone.id, {
        serialNumber: drone.serialNumber,
        droneModelId: drone.droneModel.id,
        dronePayloadId: drone.dronePayload.id,
        status: selectedStatus,
      })
      onChanged(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.unknownError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="odm-card"
        style={{ padding: 24, minWidth: 360, maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>
          {t.modal.title(drone.serialNumber, drone.droneModel?.modelCode ?? '')}
        </h3>

        {nextStatuses.length === 0 ? (
          <div style={{ color: 'var(--tx3)', fontSize: 13 }}>
            {t.modal.cannotChange(getDroneStatusLabel(drone.status, lang))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label
                htmlFor="drone-new-status"
                style={{
                  fontSize: 12,
                  color: 'var(--tx2)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                {t.modal.newStatus}
              </label>
              <select
                id="drone-new-status"
                className="odm-input"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as DroneStatus)
                }
                style={{ width: '100%' }}
              >
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {getDroneStatusLabel(s, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="drone-reason"
                style={{
                  fontSize: 12,
                  color: 'var(--tx2)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                {t.modal.reason}
              </label>
              <textarea
                id="drone-reason"
                className="odm-input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.modal.reasonPlaceholder}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {error && (
              <div style={{ color: 'var(--red-fg)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
            >
              <button
                type="button"
                className="odm-btn"
                onClick={onClose}
                disabled={saving}
              >
                {t.modal.cancel}
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={handleSave}
                disabled={saving || !selectedStatus}
              >
                {saving ? t.modal.saving : t.modal.confirm}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
