import { useEffect, useState } from 'react'
import './missionCrewCard.css'
import { dronesApi } from '../../../api/dronesApi'
import type { MissionDeviceAssignmentResponse } from '../../../types/missions'
import { Button } from 'antd'

import { OrderIcon } from '../../../components/common/OrderIcon'
import {
  groupStaffAssignments,
  initialsOf,
  STAFF_ROLE_LABELS,
  assignmentTone,
  STAFF_RESPONSE_LABELS,
} from '../../../components/common/missionDetailHelpers'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import { EmptyState } from '../../../../../shared/components/ui'
import type {
  MissionStaffAssignmentResponse,
} from '../../../types/missions'

/** Assigned drones and crew; order facts remain in the order tab. */
export function MissionCrewCard({
  staff,
  deviceCode,
  deviceLabel,
  deviceAssignments = [],
  missionId,
  canReplaceStaff,
  onReplaceDevice,
}: {
  staff: MissionStaffAssignmentResponse[]
  deviceCode: string | null
  deviceAssignments?: MissionDeviceAssignmentResponse[]
  deviceLabel: string
  missionId: string
  canReplaceStaff: boolean
  onReplaceDevice?: (assignment: MissionDeviceAssignmentResponse) => void
}) {
  const { t } = useI18n(missionDetailPageMessages)
  const [images, setImages] = useState<Record<string, string>>({})
  const deviceIds = deviceAssignments.map((device) => device.deviceId).join('|')
  useEffect(() => {
    const controller = new AbortController()
    setImages({})
    void Promise.all([...new Set(deviceIds.split('|').filter(Boolean))].map(async (id) => {
      try {
        const device = await dronesApi.getDrone(id, controller.signal)
        return [id, device.imageUrl ?? ''] as const
      } catch { return [id, ''] as const }
    })).then((entries) => {
      if (!controller.signal.aborted) setImages(Object.fromEntries(entries))
    })
    return () => controller.abort()
  }, [deviceIds])
  const staffGroups = groupStaffAssignments(staff)
  const declinedStaffGroups = staffGroups.filter((group) =>
    group.assignments.some(
      (assignment) =>
        assignment.responseStatus === 'REJECTED' &&
        assignment.isCurrent !== false,
    ),
  )
  const acceptedPeople = staffGroups.filter(
    (group) => group.responseStatus === 'ACCEPTED',
  ).length

  return (
    <section className="odm-or-card mgr-md-context mgr-md-resources" aria-label={t.contextCard}>
      <header className="mgr-md-context-heading">
        <span className="mgr-md-context-mark" aria-hidden="true">
          <OrderIcon name="stack" size={22} />
        </span>
        <h2 className="mgr-md-context-title">{t.contextCard}</h2>
      </header>
      <div className="mgr-md-context-body">
        <div className="mgr-md-context-support">
          <section className="mgr-md-context-section">
            <div className="mgr-md-context-section-head">
              <div className="mgr-md-context-section-heading">
                <span
                  className="mgr-md-context-mark is-small"
                  aria-hidden="true"
                >
                  <OrderIcon name="users" size={18} />
                </span>
                <h3>{t.crewCard}</h3>
              </div>
              <div className="mgr-md-context-head-actions">
                {staffGroups.length > 0 ? (
                  <span className="odm-or-crew-count">
                    {t.crewAccepted(acceptedPeople, staffGroups.length)}
                  </span>
                ) : null}
              </div>
            </div>
            {staffGroups.length > 0 ? (
              <progress
                className="mgr-plan-progress"
                max={staffGroups.length}
                value={acceptedPeople}
                aria-label={t.crewAccepted(acceptedPeople, staffGroups.length)}
              />
            ) : null}
            {deviceAssignments.length > 0 || deviceCode || staffGroups.length > 0 ? (
              <ul className="odm-or-crew-list mgr-md-crew-list">
                {deviceAssignments.map((device) => (
                  <li key={device.id} className="odm-or-crew-item mgr-md-device-item">
                    <img
                      src={images[device.deviceId] || '/images/auth-hero-drone.png'}
                      alt={device.deviceName || device.deviceCode || t.deviceUnknown}
                      width={72} height={56}
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = '/images/auth-hero-drone.png'
                      }}
                    />
                    <span className="odm-or-crew-main">
                      <span className="odm-or-crew-role">{device.deviceRole === 'SUPPORT' ? t.deviceSupport : t.deviceMain}</span>
                      <strong>{device.deviceName || device.deviceCode || t.deviceUnknown}</strong>
                      <small>{device.deviceCode || device.deviceSerialNumber}</small>
                      {device.replacementRequestedAt && !device.replacementCompleted && <small style={{ color: 'var(--ui-danger-text, #b42318)' }}>{device.replacementRequestReason || t.droneReplacementRequested}</small>}
                    </span>
                    {onReplaceDevice && device.replacementRequestedAt && !device.replacementCompleted && <Button onClick={() => onReplaceDevice(device)}>{t.replaceDrone}</Button>}
                  </li>
                ))}
                {deviceAssignments.length === 0 && deviceCode ? (
                  <li className="odm-or-crew-item mgr-md-device-item">
                    <span className="odm-or-crew-avatar is-device">
                      <OrderIcon name="drone" size={16} />
                    </span>
                    <span className="odm-or-crew-main">
                      <span className="odm-or-crew-role">{t.crewDevice}</span>
                      <strong>{deviceLabel}</strong>
                    </span>
                  </li>
                ) : null}
                {staffGroups.map((group) => {
                  const name =
                    group.staffName ?? group.staffEmail ?? t.staffUnknown
                  return (
                    <li key={group.staffId} className="odm-or-crew-item mgr-md-staff-item">
                      <span className="odm-or-crew-avatar" aria-hidden="true">
                        {initialsOf(name)}
                      </span>
                      <span className="odm-or-crew-main">
                        <strong>{name}</strong>
                        <span className="mgr-md-role-list">
                          {group.assignments.map((assignment) => (
                            <span
                              className="mgr-md-role-chip"
                              key={assignment.id}
                            >
                              {STAFF_ROLE_LABELS[assignment.assignedRole]}
                            </span>
                          ))}
                        </span>
                        {group.staffEmail && group.staffName ? (
                          <small>{group.staffEmail}</small>
                        ) : null}
                        {group.responseStatus === 'REJECTED' && <small style={{ color: 'var(--ui-danger-text, #b42318)' }}>{group.assignments.find(a => a.declineReason)?.declineReason}</small>}
                      </span>
                      <span
                        className={`odm-or-pill odm-or-pill-${assignmentTone(
                          group.responseStatus,
                        )}`}
                      >
                        {STAFF_RESPONSE_LABELS[group.responseStatus]}
                      </span>
                      {canReplaceStaff && declinedStaffGroups.includes(group) ? (
                        <Button
                          type="primary"
                          href={managerHref({
                            screen: 'schedule',
                            assignmentMissionId: missionId,
                            assignmentCanEdit: true,
                            assignmentReplaceStaffId: group.staffId,
                          })}
                        >
                          {declinedStaffGroups.length === 1
                            ? t.replaceDeclinedStaff
                            : t.replaceSpecificStaff(name)}
                        </Button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState title={t.crewEmpty} />
            )}
          </section>

        </div>
      </div>
    </section>
  )
}
