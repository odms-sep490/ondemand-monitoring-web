import type { AvailableDrone } from '../../../staff/api/droneApi'
import { missionGridCardMessages } from './MissionGridCard.messages'

type Messages = (typeof missionGridCardMessages)['vi']

/** Inline "add device" form of a mission card (presentation only; state lives in the card). */
export function MissionGridAddDeviceForm({
  t,
  loading,
  busy,
  role,
  onRoleChange,
  deviceId,
  onDeviceChange,
  drones,
  onCancel,
  onSave,
}: {
  t: Messages
  loading: boolean
  busy: boolean
  role: string
  onRoleChange: (role: string) => void
  deviceId: string
  onDeviceChange: (id: string) => void
  drones: AvailableDrone[]
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div
      className="odm-mcard-inline-form"
      role="group"
      aria-label={t.addDeviceAria}
      aria-busy={loading || busy}
    >
      <div className="odm-mcard-inline-form-heading">
        <strong>{t.addDeviceTitle}</strong>
        <span>{t.addDeviceHint}</span>
      </div>
      <div className="odm-mcard-inline-fields">
        <select
          aria-label={t.deviceRoleAria}
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="odm-input odm-input-sm odm-mcard-grow-1"
        >
          <option value="MAIN">{t.deviceMain}</option>
          <option value="SUPPORT">{t.deviceSupport}</option>
        </select>
        <select
          aria-label={t.deviceAvailableAria}
          value={deviceId}
          onChange={(e) => onDeviceChange(e.target.value)}
          className="odm-input odm-input-sm odm-mcard-grow-2"
          disabled={loading || busy || drones.length === 0}
        >
          {loading ? (
            <option>{t.deviceLoadingOption}</option>
          ) : drones.length === 0 ? (
            <option>{t.deviceNoneOption}</option>
          ) : (
            drones.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))
          )}
        </select>
      </div>
      <p
        className="odm-mcard-inline-form-hint"
        role={loading ? 'status' : undefined}
      >
        {loading
          ? t.deviceLoadingHint
          : drones.length > 0
            ? t.deviceCountHint(drones.length)
            : t.deviceNoneHint}
      </p>
      <div className="odm-mcard-inline-actions">
        <button
          type="button"
          className="odm-btn odm-btn-sm"
          onClick={onCancel}
          disabled={busy}
        >
          {t.cancel}
        </button>
        <button
          type="button"
          className="odm-btn odm-btn-sm odm-btn-p"
          onClick={onSave}
          disabled={busy || loading || !deviceId}
        >
          {t.save}
        </button>
      </div>
    </div>
  )
}
