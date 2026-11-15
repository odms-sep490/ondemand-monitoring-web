import { StatusBadge } from '../../../../../shared/components/ui'
import type { StatusTone } from '../../../../../shared/types/domain'
import { toUiTone } from '../../../../../shared/components/ui/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import { OrderIcon } from '../../../components/common/OrderIcon'
import type {
  MissionDeviceAssignmentResponse,
  MissionResponse,
} from '../../../types/missions'
import { MissionStatusTag } from '../../../components/common/MissionStatusTag'
import {
  assignmentTone,
  groupStaffAssignments,
  initialsOf,
  STAFF_RESPONSE_LABELS,
  STAFF_ROLE_LABELS,
} from '../../../components/common/missionDetailHelpers'
import { flightPermitCardMessages } from '../../../components/common/FlightPermitCard.messages'
import { missionExecutionPanelMessages } from './MissionExecutionPanel.messages'

type DeviceSummary = Pick<
  MissionDeviceAssignmentResponse,
  | 'id'
  | 'deviceName'
  | 'deviceCode'
  | 'deviceSerialNumber'
  | 'deviceRole'
  | 'deviceStatus'
  | 'checkupStatus'
>

function deviceFallback(mission: MissionResponse): DeviceSummary[] {
  if (!(mission.deviceName || mission.deviceCode || mission.droneCode)) return []
  return [
    {
      id: mission.deviceId ?? mission.droneId ?? mission.id,
      deviceName: mission.deviceName ?? null,
      deviceCode: mission.deviceCode ?? mission.droneCode ?? null,
      deviceSerialNumber: mission.deviceSerialNumber ?? null,
      deviceRole: 'MAIN',
      deviceStatus: mission.deviceStatus ?? null,
      checkupStatus: mission.preflightCheckedAt
        ? mission.preflightPassed
          ? 'PASSED'
          : 'FAILED'
        : 'PENDING',
    },
  ]
}

function deviceStatusTone(status: string | null): StatusTone {
  if (status === 'AVAILABLE') return 'green'
  if (['MAINTENANCE', 'OUT_OF_SERVICE', 'OFFLINE'].includes(status ?? ''))
    return 'red'
  if (
    ['PREFLIGHT', 'IN_MISSION', 'ACTIVE_MISSION', 'RETURNING'].includes(
      status ?? '',
    )
  )
    return 'blue'
  if (['RESERVED', 'CHARGING', 'IDLE_CHARGING'].includes(status ?? ''))
    return 'yellow'
  return 'gray'
}

function checkStatusTone(status: DeviceSummary['checkupStatus']): StatusTone {
  if (status === 'PASSED') return 'green'
  if (status === 'FAILED') return 'red'
  if (status === 'CHECKING') return 'blue'
  if (status === 'PENDING') return 'yellow'
  return 'gray'
}

export function MissionExecutionContext({
  mission,
  showMissionLink = true,
}: {
  mission: MissionResponse
  showMissionLink?: boolean
}) {
  const { t } = useI18n(missionExecutionPanelMessages)
  const { t: permit } = useI18n(flightPermitCardMessages)
  const staff = groupStaffAssignments(mission.staffAssignments ?? [])
  const acceptedCount = staff.filter(
    (member) => member.responseStatus === 'ACCEPTED',
  ).length
  const devices = mission.deviceAssignments?.length
    ? mission.deviceAssignments
    : deviceFallback(mission)

  return (
    <section
      className="odm-execution-status"
      aria-label={t.missionSummary(mission.missionCode)}
    >
      <header className="odm-execution-status__head">
        <div>
          <p className="odm-execution-status__eyebrow">
            {t.executionProgress}
          </p>
          <h2>{mission.missionCode}</h2>
        </div>
        <div className="odm-execution-status__actions">
          <MissionStatusTag mission={mission} />
          {showMissionLink && (
            <a
              className="odm-execution-status__link"
              href={managerHref({ screen: 'missionDetail', missionId: mission.id })}
            >
              {t.openMission}
            </a>
          )}
        </div>
      </header>

      <div className="odm-execution-status__grid">
        <section className="odm-execution-status__card" aria-label={t.device}>
          <div className="odm-execution-status__section-head">
            <div>
              <h3>{t.device}</h3>
              <p>{t.deviceAssignedCount(devices.length)}</p>
            </div>
          </div>

          {devices.length ? (
            <ul className="odm-or-crew-list">
              {devices.map((device) => {
                const deviceName =
                  device.deviceName || device.deviceCode || t.notAssigned
                const deviceStatus = device.deviceStatus
                  ? permit.deviceStatuses[device.deviceStatus] ??
                    device.deviceStatus
                  : t.deviceStatusUnavailable
                const checkStatus =
                  permit.checkStatuses[device.checkupStatus] ??
                  device.checkupStatus

                return (
                  <li className="odm-or-crew-item" key={device.id}>
                    <span
                      className="odm-or-crew-avatar is-device"
                      aria-hidden="true"
                    >
                      <OrderIcon name="drone" size={16} />
                    </span>
                    <span className="odm-or-crew-main">
                      <span className="odm-or-crew-role">
                        {permit.deviceRole[device.deviceRole]}
                      </span>
                      <strong>{deviceName}</strong>
                      {device.deviceCode && device.deviceName ? (
                        <small>{device.deviceCode}</small>
                      ) : null}
                      {device.deviceSerialNumber ? (
                        <small>{device.deviceSerialNumber}</small>
                      ) : null}
                    </span>
                    <span className="odm-execution-status__badges">
                      <StatusBadge
                        tone={toUiTone(deviceStatusTone(device.deviceStatus))}
                      >
                        {deviceStatus}
                      </StatusBadge>
                      <StatusBadge
                        tone={toUiTone(checkStatusTone(device.checkupStatus))}
                      >
                        {checkStatus}
                      </StatusBadge>
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="odm-execution-status__empty">{t.notAssigned}</p>
          )}
        </section>

        <section className="odm-execution-status__card" aria-label={t.staff}>
          <div className="odm-execution-status__section-head">
            <div>
              <h3>{t.staff}</h3>
              <p>
                {staff.length
                  ? t.staffProgress(acceptedCount, staff.length)
                  : t.notAssigned}
              </p>
            </div>
            {staff.length ? (
              <span className="odm-or-crew-count">
                {acceptedCount}/{staff.length}
              </span>
            ) : null}
          </div>

          {staff.length ? (
            <>
              <progress
                className="odm-execution-status__progress"
                max={staff.length}
                value={acceptedCount}
                aria-label={t.staffProgress(acceptedCount, staff.length)}
              />
              <ul className="odm-or-crew-list">
                {staff.map((member) => {
                  const name =
                    member.staffName ?? member.staffEmail ?? t.unknownStaff
                  return (
                    <li className="odm-or-crew-item" key={member.staffId}>
                      <span className="odm-or-crew-avatar" aria-hidden="true">
                        {initialsOf(name)}
                      </span>
                      <span className="odm-or-crew-main">
                        <strong>{name}</strong>
                        <span className="odm-or-crew-roles">
                          {member.assignments.map((assignment) => (
                            <span key={assignment.id}>
                              {STAFF_ROLE_LABELS[assignment.assignedRole]}
                            </span>
                          ))}
                        </span>
                      </span>
                      <span
                        className={`odm-or-pill odm-or-pill-${assignmentTone(member.responseStatus)}`}
                      >
                        {STAFF_RESPONSE_LABELS[member.responseStatus]}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <p className="odm-execution-status__empty">{t.notAssigned}</p>
          )}
        </section>
      </div>
    </section>
  )
}
