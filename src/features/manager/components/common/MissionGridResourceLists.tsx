import { CloseOutlined } from '@ant-design/icons'
import type {
  MissionDeviceAssignmentResponse,
  MissionStaffAssignmentResponse,
} from '../../types/missions'
import { STAFF_ROLE_LABELS } from './missionDetailHelpers'
import { missionGridCardMessages } from './MissionGridCard.messages'

type Messages = (typeof missionGridCardMessages)['vi']

export function MissionGridStaffList({
  t,
  staff,
  canRemove,
  busy,
  onRemove,
}: {
  t: Messages
  staff: MissionStaffAssignmentResponse[]
  canRemove: boolean
  busy: boolean
  onRemove: (staffId: string, role: string) => void
}) {
  return (
    <div className="odm-mcard-res-list">
      {staff.length === 0 ? (
        <p className="odm-mission-meta odm-mcard-note">{t.staffEmpty}</p>
      ) : (
        staff.map((item, idx) => (
          <div
            key={item.id || `${item.staffId}-${idx}`}
            className="odm-mcard-res-item"
          >
            <div>
              <span className="odm-mcard-res-role">
                {STAFF_ROLE_LABELS[item.assignedRole] || item.assignedRole}:
              </span>{' '}
              <strong>{item.staffName || t.staffUnnamed}</strong>
            </div>
            {canRemove && (
              <button
                type="button"
                className="odm-mcard-res-remove"
                title={t.staffRemoveTitle}
                aria-label={t.staffRemoveTitle}
                onClick={() => onRemove(item.staffId, item.assignedRole)}
                disabled={busy}
              >
                <CloseOutlined aria-hidden="true" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export function MissionGridDeviceList({
  t,
  devices,
  canRemove,
  busy,
  onRemove,
}: {
  t: Messages
  devices: MissionDeviceAssignmentResponse[]
  canRemove: boolean
  busy: boolean
  onRemove: (deviceId: string) => void
}) {
  return (
    <div className="odm-mcard-res-list">
      {devices.length === 0 ? (
        <p className="odm-mission-meta odm-mcard-note">{t.deviceEmpty}</p>
      ) : (
        devices.map((dev, idx) => (
          <div
            key={dev.id || `${dev.deviceId}-${idx}`}
            className="odm-mcard-res-item"
          >
            <div>
              <span className="odm-mcard-res-role">
                {dev.deviceRole === 'SUPPORT'
                  ? t.deviceRoleShortSupport
                  : t.deviceRoleShortMain}
                :
              </span>{' '}
              <strong>{dev.deviceName || dev.deviceCode || t.deviceFallback}</strong>
            </div>
            {canRemove && (
              <button
                type="button"
                className="odm-mcard-res-remove"
                title={t.deviceRemoveTitle}
                aria-label={t.deviceRemoveTitle}
                onClick={() => onRemove(dev.deviceId)}
                disabled={busy}
              >
                <CloseOutlined aria-hidden="true" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}
