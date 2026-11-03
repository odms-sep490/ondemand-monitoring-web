import { CloseOutlined } from '@ant-design/icons'
import type {
  MissionDeviceAssignmentResponse,
  MissionStaffAssignmentResponse,
} from '../../types/missions'
import { STAFF_ROLE_LABELS } from './missionDetailHelpers'
import { missionGridCardMessages } from './MissionGridCard.messages'
import { MissionGridDroneSprite } from './MissionGridDroneSprite'

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
  onRemove: (assignmentId: string) => void
}) {
  const staffGroups = Array.from(
    staff.reduce((groups, assignment) => {
      const current = groups.get(assignment.staffId) ?? {
        staffId: assignment.staffId,
        staffName: assignment.staffName,
        assignments: [],
      }
      current.assignments.push(assignment)
      groups.set(assignment.staffId, current)
      return groups
    }, new Map<string, { staffId: string; staffName?: string | null; assignments: MissionStaffAssignmentResponse[] }>()),
  ).map(([, group]) => group)

  return (
    <div className="odm-mcard-res-list">
      {staffGroups.length === 0 ? (
        <p className="odm-mission-meta odm-mcard-note">{t.staffEmpty}</p>
      ) : (
        staffGroups.map((group) => (
          <div
            key={group.staffId}
            className="odm-mcard-res-item odm-mcard-res-staff-group"
          >
            <div className="odm-mcard-res-staff-main">
              <strong>{group.staffName || t.staffUnnamed}</strong>
              <div className="odm-mcard-res-role-list">
                {group.assignments.map((item) => {
                  const roleName =
                    STAFF_ROLE_LABELS[item.assignedRole] || item.assignedRole
                  return (
                    <span
                      key={item.id || `${item.staffId}-${item.assignedRole}`}
                      className="odm-mcard-res-role-chip"
                    >
                      <span>{roleName}</span>
                      {canRemove && (
                        <button
                          type="button"
                          className="odm-mcard-res-remove"
                          title={t.staffRemoveRoleTitle(
                            group.staffName || t.staffUnnamed,
                            roleName,
                          )}
                          aria-label={t.staffRemoveRoleTitle(
                            group.staffName || t.staffUnnamed,
                            roleName,
                          )}
                          onClick={() => onRemove(item.id)}
                          disabled={busy}
                        >
                          <CloseOutlined aria-hidden="true" />
                        </button>
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
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
  enteringDeviceId,
}: {
  t: Messages
  devices: MissionDeviceAssignmentResponse[]
  canRemove: boolean
  busy: boolean
  onRemove: (assignmentId: string) => void
  enteringDeviceId?: string | null
}) {
  return (
    <div className="odm-mcard-res-list mg-assigned-drone-list">
      {devices.length === 0 ? (
        <p className="odm-mission-meta odm-mcard-note">{t.deviceEmpty}</p>
      ) : (
        devices.map((dev, idx) => (
          <div
            key={dev.id || `${dev.deviceId}-${idx}`}
            className={`odm-mcard-res-item mg-assigned-drone${
              enteringDeviceId === dev.deviceId ? ' is-entering' : ''
            }`}
          >
            <div className="mg-assigned-drone-icon">
              <MissionGridDroneSprite size={42} />
            </div>
            <div className="mg-assigned-drone-copy">
              <strong>{dev.deviceName || dev.deviceCode || t.deviceFallback}</strong>
              <span>
                {dev.deviceCode || dev.deviceSerialNumber || dev.deviceId}
                {' · '}
                {dev.deviceRole === 'SUPPORT'
                  ? t.deviceRoleShortSupport
                  : t.deviceRoleShortMain}
              </span>
            </div>
            <span className="mg-assigned-drone-status">
              <i aria-hidden="true" />
              {t.deviceAssignedStatus}
            </span>
            {canRemove && (
              <button
                type="button"
                className="odm-mcard-res-remove"
                title={t.deviceRemoveTitle}
                aria-label={t.deviceRemoveTitle}
                onClick={() => onRemove(dev.id)}
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
