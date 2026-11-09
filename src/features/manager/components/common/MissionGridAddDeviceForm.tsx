import type { AvailableDrone } from '../../../staff/api/droneApi'
import { missionGridCardMessages } from './MissionGridCard.messages'
import { MissionGridDroneSprite } from './MissionGridDroneSprite'

type Messages = (typeof missionGridCardMessages)['vi']

/** Available-device dock. Assignment and source-of-truth state stay in MissionGridCard. */
export function MissionGridAddDeviceForm({
  t,
  loading,
  busy,
  role,
  onRoleChange,
  drones,
  activeDeviceId,
  onCancel,
  onAssign,
  onSourceRef,
}: {
  t: Messages
  loading: boolean
  busy: boolean
  role: string
  onRoleChange: (role: string) => void
  drones: AvailableDrone[]
  activeDeviceId: string
  onCancel: () => void
  onAssign: (deviceId: string) => void
  onSourceRef: (deviceId: string, element: HTMLDivElement | null) => void
}) {
  return (
    <div
      className="odm-mcard-inline-form mg-drone-dock"
      role="group"
      aria-label={t.addDeviceAria}
      aria-busy={loading || busy}
    >
      <div className="mg-drone-dock-toolbar">
        <div className="odm-mcard-inline-form-heading">
          <strong>{t.addDeviceTitle}</strong>
          <span>{t.addDeviceHint}</span>
        </div>
        <label className="mg-drone-role-field">
          <span>{t.deviceRoleAria}</span>
          <select
            aria-label={t.deviceRoleAria}
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
            className="odm-input odm-input-sm"
            disabled={busy}
          >
            <option value="MAIN">{t.deviceMain}</option>
            <option value="SUPPORT">{t.deviceSupport}</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="odm-mcard-inline-form-hint" role="status">
          {t.deviceLoadingHint}
        </p>
      ) : drones.length > 0 ? (
        <div className="mg-drone-dock-list">
          {drones.map((drone) => (
            <div
              className={`mg-drone-dock-item${
                !isDroneAvailable(drone) ? ' is-unavailable' : ''
              }`}
              key={drone.id}
            >
              <div
                className="mg-drone-dock-source"
                ref={(element) => onSourceRef(drone.id, element)}
                aria-hidden="true"
              >
                <MissionGridDroneSprite size={42} />
              </div>
              <div className="mg-drone-dock-copy">
                <strong title={drone.label}>{drone.label}</strong>
                <span>
                  <i aria-hidden="true" />
                  {isDroneAvailable(drone)
                    ? t.deviceAvailableStatus
                    : t.deviceUnavailableStatus}
                </span>
              </div>
              <button
                type="button"
                className="odm-btn odm-btn-sm odm-btn-p mg-drone-assign-button"
                onClick={() => onAssign(drone.id)}
                disabled={busy || !drone.id || !isDroneAvailable(drone)}
                aria-label={`${t.deviceAssignAction}: ${drone.label}`}
              >
                {busy && activeDeviceId === drone.id
                  ? t.deviceAssigning
                  : t.deviceAssignAction}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="odm-mcard-inline-form-hint">{t.deviceNoneHint}</p>
      )}

      <div className="odm-mcard-inline-actions">
        <span className="odm-mcard-inline-form-hint">
          {loading ? '' : t.deviceCountHint(drones.length)}
        </span>
        <button
          type="button"
          className="odm-btn odm-btn-sm"
          onClick={onCancel}
          disabled={busy}
        >
          {t.cancel}
        </button>
      </div>
    </div>
  )
}

function isDroneAvailable(drone: AvailableDrone) {
  const status = drone.status?.trim().toUpperCase()
  return !status || status === 'AVAILABLE'
}
