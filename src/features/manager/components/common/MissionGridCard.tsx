import { CloseOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import type { OrderChecklistSnapshot, OrderDetail } from '../../types/orders'
import type { MissionResponse } from '../../types/missions'
import type { ExecutionPlan } from '../../types/planning'
import { StatusBadge, toUiTone } from '../../../../shared/components/ui'
import {
  missionStatusLabel,
  missionStatusTone,
} from '../../../../shared/lib/statusTone'
import { managerHref } from '../../routes'
import { OrderIcon } from './OrderIcon'
import { planningSchedule } from './planningSchedule'
import { planningApi } from '../../api/planningApi'
import { missionsApi } from '../../api/missionsApi'
import { droneApi, type AvailableDrone } from '../../../staff/api/droneApi'
import {
  operatorApi,
  type AvailableOperator,
} from '../../../staff/api/operatorApi'
import { MissionUpdatePanel } from './MissionUpdatePanel'
import {
  MissionGridDeviceList,
  MissionGridStaffList,
} from './MissionGridResourceLists'
import {
  MissionGridAddStaffForm,
  type StaffAssignmentDraft,
} from './MissionGridAddStaffForm'
import { MissionGridAddDeviceForm } from './MissionGridAddDeviceForm'
import { MissionGridFlyingDrone } from './MissionGridDroneSprite'
import { useDroneAssignmentAnimation } from './useDroneAssignmentAnimation'
import type { MissionStaffRole } from '../../../mission/types/mission'
import { useI18n } from '../../../../shared/i18n'
import { missionGridCardMessages } from './MissionGridCard.messages'
import './MissionGridCard.css'
import './MissionGridDroneAssignment.css'

interface MissionGridCardProps {
  mission: MissionResponse
  order: OrderDetail
  plan: ExecutionPlan
  orderChecklistItems: OrderChecklistSnapshot[]
  disabled: boolean
  onPlanChanged: () => void
  onRequestReason: (
    title: string,
    hint: string,
    onConfirm: (reason: string) => Promise<void>,
  ) => void
  onEditMission?: (mission: MissionResponse) => void
}

const ROLES: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]

export function MissionGridCard({
  mission,
  order,
  plan,
  orderChecklistItems,
  disabled,
  onPlanChanged,
  onRequestReason,
  onEditMission,
}: MissionGridCardProps) {
  const { t } = useI18n(missionGridCardMessages)
  const isPlanning = mission.status === 'PLANNING'
  const isReady = mission.status === 'READY'
  const isCancelled = mission.status === 'CANCELLED'
  const cardRef = useRef<HTMLElement>(null)
  const missionIdRef = useRef(mission.id)
  missionIdRef.current = mission.id
  const animation = useDroneAssignmentAnimation(cardRef)
  const sourceRefs = useRef(new Map<string, HTMLDivElement>())
  const assignmentAttemptRef = useRef(0)
  const deviceLoadAttemptRef = useRef(0)
  const assignmentInProgressRef = useRef(false)
  const revealTimerRef = useRef<number | null>(null)

  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeDeviceId, setActiveDeviceId] = useState('')
  const [revealedDeviceId, setRevealedDeviceId] = useState<string | null>(null)

  // Add Staff Popover state
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [availableOperators, setAvailableOperators] = useState<
    AvailableOperator[]
  >([])
  const [staffAssignmentsDraft, setStaffAssignmentsDraft] = useState<
    StaffAssignmentDraft[]
  >([])
  const [loadingStaff, setLoadingStaff] = useState(false)

  // Add Device Popover state
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [availableDrones, setAvailableDrones] = useState<AvailableDrone[]>([])
  const [selectedDeviceRole, setSelectedDeviceRole] = useState('MAIN')
  const [loadingDevices, setLoadingDevices] = useState(false)

  useEffect(() => {
    return () => {
      assignmentAttemptRef.current += 1
      deviceLoadAttemptRef.current += 1
      assignmentInProgressRef.current = false
      animation.cancel()
      if (revealTimerRef.current !== null) {
        window.clearTimeout(revealTimerRef.current)
      }
      sourceRefs.current.clear()
    }
  }, [animation.cancel, mission.id])

  useEffect(() => {
    animation.reset()
  }, [animation.reset, mission.id])

  useEffect(() => {
    if (animation.phase !== 'SUCCESS') return
    const timer = window.setTimeout(() => animation.reset(), 1800)
    return () => window.clearTimeout(timer)
  }, [animation.phase, animation.reset])

  // Assigned checklists for this mission
  const scope = plan.missions.find((m) => m.missionId === mission.id)
  const assignedChecklistIds: string[] = scope?.checklistItemIds || []
  const assignedChecklists = orderChecklistItems.filter((item) =>
    assignedChecklistIds.includes(item.id),
  )

  // Staff and device counts
  const currentStaff = mission.staffAssignments || []
  const assignedRolesByStaff = currentStaff.reduce<
    Record<string, MissionStaffRole[]>
  >((rolesByStaff, assignment) => {
    const assignedRoles = rolesByStaff[assignment.staffId] ?? []
    if (!assignedRoles.includes(assignment.assignedRole)) {
      rolesByStaff[assignment.staffId] = [
        ...assignedRoles,
        assignment.assignedRole,
      ]
    }
    return rolesByStaff
  }, {})
  const currentStaffCount = Object.keys(assignedRolesByStaff).length
  const hasUnassignedRoles = Object.values(assignedRolesByStaff).some(
    (assignedRoles) => ROLES.some((role) => !assignedRoles.includes(role)),
  )
  const currentDevices =
    mission.deviceAssignments && mission.deviceAssignments.length > 0
      ? mission.deviceAssignments
      : mission.droneId || mission.deviceId
        ? [
            {
              id: mission.deviceId || mission.droneId || 'default-device',
              deviceId: mission.deviceId || mission.droneId || '',
              deviceCode: mission.deviceCode || mission.droneCode || null,
              deviceName: mission.deviceName || mission.deviceCode || 'Drone',
              deviceSerialNumber: null,
              deviceStatus: null,
              deviceRole: 'MAIN' as const,
              checkupStatus: 'PENDING' as const,
              assignedAt: null,
            },
          ]
        : []
  const maxStaff = 10
  const maxDevices = 10
  const remainingStaffSlots = Math.max(0, maxStaff - currentStaffCount)

  // 1. Remove Checklist Item (Click [X])
  async function handleRemoveChecklist(itemId: string) {
    if (disabled || busy || !isPlanning) return
    const remainingIds = assignedChecklistIds.filter(
      (id: string) => id !== itemId,
    )
    if (remainingIds.length === 0) {
      setErrorMsg(t.errMinWork)
      return
    }
    setBusy(true)
    setErrorMsg('')
    try {
      await planningApi.updateMissionChecklistAssignments(
        mission.id,
        plan.revision,
        remainingIds,
      )
      onPlanChanged()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t.errRemoveWork)
    } finally {
      setBusy(false)
    }
  }

  // 2. Open Add Staff
  async function handleOpenAddStaff() {
    setShowAddStaff(true)
    setShowAddDevice(false)
    setStaffAssignmentsDraft([])
    setAvailableOperators([])
    setLoadingStaff(true)
    setErrorMsg('')
    try {
      const ops = await operatorApi.getAvailable(mission.id)
      setAvailableOperators(ops)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t.errLoadStaff)
    } finally {
      setLoadingStaff(false)
    }
  }

  // Submit Add Staff
  async function handleConfirmAddStaff(assignments: StaffAssignmentDraft[]) {
    if (assignments.length === 0 || busy) return
    const existingStaffIds = new Set(
      currentStaff.map((assignment) => assignment.staffId),
    )
    const newStaffCount = assignments.filter(
      ({ staffId }) => !existingStaffIds.has(staffId),
    ).length
    if (newStaffCount > remainingStaffSlots) {
      setErrorMsg(t.errStaffLimit(maxStaff))
      return
    }

    const roleRequests = assignments.flatMap(({ staffId, roles }) =>
      roles.map((role) => ({ staffId, role })),
    )
    if (roleRequests.length === 0) return

    const doAssign = async () => {
      setBusy(true)
      setErrorMsg('')
      const assignedRoleKeys = new Set<string>()
      for (const assignment of assignments) {
        try {
          await missionsApi.assignStaff(
            mission.id,
            assignment.staffId,
            assignment.roles,
          )
          assignment.roles.forEach((role) => {
            assignedRoleKeys.add(`${assignment.staffId}:${role}`)
          })
        } catch (err: unknown) {
          const remainingAssignments = roleRequests.filter(
            (item) => !assignedRoleKeys.has(`${item.staffId}:${item.role}`),
          )
          const remainingByStaff = remainingAssignments.reduce<
            StaffAssignmentDraft[]
          >((grouped, item) => {
            const existing = grouped.find(
              (entry) => entry.staffId === item.staffId,
            )
            if (existing) existing.roles.push(item.role)
            else grouped.push({ staffId: item.staffId, roles: [item.role] })
            return grouped
          }, [])
          const reason = err instanceof Error ? err.message : t.errAssignStaff
          setStaffAssignmentsDraft(remainingByStaff)
          setErrorMsg(
            assignedRoleKeys.size > 0
              ? t.staffPartialAssignment(
                  assignedRoleKeys.size,
                  roleRequests.length,
                  reason,
                )
              : reason,
          )
          if (assignedRoleKeys.size > 0) onPlanChanged()
          setBusy(false)
          return
        }
      }

      setShowAddStaff(false)
      setStaffAssignmentsDraft([])
      onPlanChanged()
      setBusy(false)
    }

    if (isReady) {
      onRequestReason(t.reasonAddStaffTitle, t.reasonAddStaffHint, async () => {
        await doAssign()
      })
    } else {
      await doAssign()
    }
  }

  // Remove Staff
  function handleRemoveStaff(assignmentId: string) {
    if (disabled || busy) return
    const doRemove = async () => {
      setBusy(true)
      setErrorMsg('')
      try {
        await missionsApi.removeStaff(mission.id, assignmentId)
        onPlanChanged()
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : t.errRemoveStaff)
      } finally {
        setBusy(false)
      }
    }

    if (isReady) {
      onRequestReason(
        t.reasonRemoveStaffTitle,
        t.reasonRemoveStaffHint,
        async () => {
          await doRemove()
        },
      )
    } else {
      void doRemove()
    }
  }

  // 3. Open Add Device
  async function handleOpenAddDevice() {
    const missionId = mission.id
    const requestId = ++deviceLoadAttemptRef.current
    setShowAddDevice(true)
    setShowAddStaff(false)
    setAvailableDrones([])
    setLoadingDevices(true)
    setErrorMsg('')
    try {
      const drones = await droneApi.getAvailable(missionId)
      if (
        requestId !== deviceLoadAttemptRef.current ||
        missionId !== missionIdRef.current
      ) return
      setAvailableDrones(drones)
    } catch (err: unknown) {
      if (
        requestId !== deviceLoadAttemptRef.current ||
        missionId !== missionIdRef.current
      ) return
      setErrorMsg(err instanceof Error ? err.message : t.errLoadDevices)
    } finally {
      if (
        requestId === deviceLoadAttemptRef.current &&
        missionId === missionIdRef.current
      ) setLoadingDevices(false)
    }
  }

  // Submit Add Device
  function handleConfirmAddDevice(deviceId: string) {
    if (!deviceId || busy || assignmentInProgressRef.current) return
    const missionId = mission.id
    const intentId = assignmentAttemptRef.current
    const doAssign = async () => {
      if (
        missionId !== missionIdRef.current ||
        intentId !== assignmentAttemptRef.current
      ) return
      if (assignmentInProgressRef.current) return
      assignmentInProgressRef.current = true
      const requestId = ++assignmentAttemptRef.current
      const isCurrentRequest = () =>
        requestId === assignmentAttemptRef.current &&
        missionId === missionIdRef.current
      setBusy(true)
      setActiveDeviceId(deviceId)
      setErrorMsg('')
      const requestSettled = { current: false }
      try {
        const flight = animation.flyToTarget(
          sourceRefs.current.get(deviceId) ?? null,
          animation.targetRef.current,
          () => {
            if (isCurrentRequest() && !requestSettled.current) {
              animation.awaitConfirmation()
            }
          },
        )
        const assignment = missionsApi
          .assignDevice(missionId, deviceId, selectedDeviceRole)
          .then(
            (response) => {
              requestSettled.current = true
              return response
            },
            (error: unknown) => {
              requestSettled.current = true
              throw error
            },
          )
        await Promise.all([assignment, flight])
        if (!isCurrentRequest()) return
        await animation.land()
        if (!isCurrentRequest()) return
        setRevealedDeviceId(deviceId)
        setShowAddDevice(false)
        try {
          await onPlanChanged()
        } catch {
          // Assignment is already confirmed by the server. Keep the success state;
          // the parent query owns refresh errors and remains the source of truth.
        }
        if (!isCurrentRequest()) return
        if (revealTimerRef.current !== null) {
          window.clearTimeout(revealTimerRef.current)
        }
        revealTimerRef.current = window.setTimeout(() => {
          setRevealedDeviceId((current) =>
            current === deviceId ? null : current,
          )
        }, 900)
      } catch (err: unknown) {
        if (!isCurrentRequest()) return
        await animation.rollback()
        if (!isCurrentRequest()) return
        setErrorMsg(err instanceof Error ? err.message : t.errAssignDevice)
      } finally {
        if (isCurrentRequest()) {
          requestSettled.current = true
          assignmentInProgressRef.current = false
          setActiveDeviceId('')
          setBusy(false)
        }
      }
    }

    if (isReady) {
      onRequestReason(
        t.reasonAddDeviceTitle,
        t.reasonAddDeviceHint,
        async () => {
          await doAssign()
        },
      )
    } else {
      void doAssign()
    }
  }

  // Remove Device
  function handleRemoveDevice(assignmentId: string) {
    if (disabled || busy) return
    const doRemove = async () => {
      setBusy(true)
      setErrorMsg('')
      try {
        await missionsApi.removeDevice(mission.id, assignmentId)
        onPlanChanged()
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : t.errRemoveDevice)
      } finally {
        setBusy(false)
      }
    }

    if (isReady) {
      onRequestReason(
        t.reasonRemoveDeviceTitle,
        t.reasonRemoveDeviceHint,
        async () => {
          await doRemove()
        },
      )
    } else {
      void doRemove()
    }
  }

  // 4. Cancel Mission
  function handleCancelMission() {
    onRequestReason(
      t.cancelMission(mission.missionCode ?? ''),
      t.reasonCancelHint,
      async (reason) => {
        setBusy(true)
        try {
          await planningApi.cancelMission(mission.id, {
            expectedPlanRevision: plan.revision,
            reason: reason.trim(),
          })
          onPlanChanged()
        } catch (err: unknown) {
          setErrorMsg(err instanceof Error ? err.message : t.errCancel)
        } finally {
          setBusy(false)
        }
      },
    )
  }

  async function handleConfirmPlanning() {
    if (disabled || busy || !isPlanning || plan.planStatus !== 'FINALIZED')
      return
    setBusy(true)
    setErrorMsg('')
    try {
      await missionsApi.confirmMissionPlanning(mission.id)
      onPlanChanged()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t.errConfirmMission)
    } finally {
      setBusy(false)
    }
  }

  const cardStatusClass = isCancelled
    ? 'is-cancelled'
    : isReady
      ? 'is-ready'
      : 'is-planning'

  return (
    <article
      ref={cardRef}
      className={`odm-mission-grid-card ${cardStatusClass}`}
      aria-label={mission.missionCode}
    >
      {/* Header */}
      <div className="odm-mcard-header">
        <div className="odm-mcard-title-group">
          <strong>
            <a
              href={managerHref({
                screen: 'missionDetail',
                missionId: mission.id,
              })}
            >
              {mission.missionCode || t.mission}
            </a>
          </strong>
          <span>{mission.orderTitle || t.orderScope}</span>
        </div>
        <div className="odm-mcard-inline">
          <StatusBadge
            tone={toUiTone(missionStatusTone[mission.status] ?? 'gray')}
          >
            {missionStatusLabel[mission.status] ?? mission.status}
          </StatusBadge>
          {isPlanning && plan.planStatus === 'FINALIZED' && !disabled && (
            <button
              type="button"
              className="odm-btn odm-btn-sm odm-btn-p"
              disabled={busy}
              onClick={() => void handleConfirmPlanning()}
              title={`Xác nhận Mission ${mission.missionCode ?? ''}`}
            >
              {busy ? 'Đang xác nhận…' : 'Xác nhận'}
            </button>
          )}
          {isPlanning &&
            !disabled &&
            (onEditMission ? (
              <button
                type="button"
                className="odm-btn odm-btn-sm"
                disabled={disabled || busy}
                onClick={() => onEditMission(mission)}
                title={t.editTitle(mission.missionCode ?? '')}
              >
                {t.edit}
              </button>
            ) : (
              <MissionUpdatePanel
                mission={mission}
                order={order}
                plan={plan}
                orderChecklistItems={orderChecklistItems}
                disabled={disabled || busy}
                onUpdated={onPlanChanged}
              />
            ))}
        </div>
      </div>

      {errorMsg && (
        <div className="odm-mcard-error" role="alert">
          {errorMsg}
        </div>
      )}

      {/* Schedule Section */}
      <div className="odm-mcard-section">
        <div className="odm-mcard-sec-head">
          <span>{t.schedule}</span>
        </div>
        <div className="odm-mcard-schedule">
          <OrderIcon name="calendar" size={14} />
          <span>
            {planningSchedule(mission.scheduledStartAt, mission.scheduledEndAt)}
          </span>
        </div>
      </div>

      {/* Work items Section */}
      <div className="odm-mcard-section">
        <div className="odm-mcard-sec-head">
          <span>{t.work(assignedChecklists.length)}</span>
        </div>
        <div className="odm-mcard-checklist-list">
          {assignedChecklists.length === 0 ? (
            <p className="odm-mission-meta odm-mcard-note">{t.workEmpty}</p>
          ) : (
            assignedChecklists.map((item) => (
              <div key={item.id} className="odm-mcard-ch-item">
                <span>{item.content}</span>
                {isPlanning && (
                  <button
                    type="button"
                    className="odm-mcard-ch-remove"
                    title={t.workRemoveTitle}
                    aria-label={t.workRemoveTitle}
                    onClick={() => handleRemoveChecklist(item.id)}
                    disabled={disabled || busy}
                  >
                    <CloseOutlined aria-hidden="true" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Staff Section */}
      <div className="odm-mcard-section">
        <div className="odm-mcard-sec-head">
          <span>{t.resourcePreparation}</span>
          <StatusBadge
            tone={toUiTone(missionStatusTone[mission.status] ?? 'gray')}
          >
            {missionStatusLabel[mission.status] ?? mission.status}
          </StatusBadge>
        </div>
        <div className="odm-mcard-sec-head">
          <span>{t.staffHead(currentStaffCount, maxStaff)}</span>
          {!isCancelled && !disabled && (
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={handleOpenAddStaff}
              disabled={
                busy || (remainingStaffSlots === 0 && !hasUnassignedRoles)
              }
            >
              {t.addShort}
            </button>
          )}
        </div>

        {showAddStaff && (
          <MissionGridAddStaffForm
            t={t}
            loading={loadingStaff}
            busy={busy}
            roles={ROLES}
            assignedRolesByStaff={assignedRolesByStaff}
            assignments={staffAssignmentsDraft}
            onAssignmentsChange={setStaffAssignmentsDraft}
            remainingSlots={remainingStaffSlots}
            operators={availableOperators}
            onCancel={() => {
              setShowAddStaff(false)
              setStaffAssignmentsDraft([])
              setErrorMsg('')
            }}
            onSave={handleConfirmAddStaff}
          />
        )}

        <MissionGridStaffList
          t={t}
          staff={currentStaff}
          canRemove={!isCancelled && !disabled}
          busy={busy}
          onRemove={handleRemoveStaff}
        />
      </div>

      {/* Device Section */}
      <div className="odm-mcard-section">
        <div className="odm-mcard-sec-head">
          <span>{t.deviceHead(currentDevices.length, maxDevices)}</span>
          {!isCancelled && !disabled && currentDevices.length < maxDevices && (
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={handleOpenAddDevice}
              disabled={busy}
            >
              {t.add}
            </button>
          )}
        </div>

        <MissionGridDeviceList
          t={t}
          devices={currentDevices}
          canRemove={!isCancelled && !disabled}
          busy={busy}
          onRemove={handleRemoveDevice}
          enteringDeviceId={revealedDeviceId}
        />

        {!isCancelled && !disabled && currentDevices.length < maxDevices && (
          <div
            ref={animation.targetRef}
            className={`mg-drone-assignment-target${
              animation.phase !== 'IDLE' &&
              animation.phase !== 'SUCCESS' &&
              animation.phase !== 'ERROR'
                ? ' is-active'
                : ''
            }`}
          >
            <span className="mg-drone-target-pulse mg-drone-target-pulse--first" />
            <span className="mg-drone-target-pulse mg-drone-target-pulse--second" />
            <span className="mg-drone-target-crosshair" aria-hidden="true">
              <i />
            </span>
            <span className="mg-drone-target-copy">
              <strong>{t.deviceAssignTarget}</strong>
              <span>{t.deviceAssignTargetHint}</span>
            </span>
          </div>
        )}

        {showAddDevice && (
          <MissionGridAddDeviceForm
            t={t}
            loading={loadingDevices}
            busy={busy}
            role={selectedDeviceRole}
            onRoleChange={setSelectedDeviceRole}
            drones={availableDrones}
            activeDeviceId={activeDeviceId}
            onCancel={() => {
              deviceLoadAttemptRef.current += 1
              setShowAddDevice(false)
              setErrorMsg('')
            }}
            onAssign={handleConfirmAddDevice}
            onSourceRef={(deviceId, element) => {
              if (element) sourceRefs.current.set(deviceId, element)
              else sourceRefs.current.delete(deviceId)
            }}
          />
        )}

        <p
          className={`mg-drone-assignment-feedback is-${animation.phase.toLowerCase()}`}
          role="status"
          aria-live="polite"
        >
          {animation.phase === 'IDLE'
            ? t.deviceAssignIdle
            : animation.phase === 'PREPARING'
              ? t.deviceAssignPreparing
              : animation.phase === 'FLYING'
                ? t.deviceAssignFlying
                : animation.phase === 'AWAITING_CONFIRMATION'
                  ? t.deviceAssignWaiting
                  : animation.phase === 'LANDING'
                    ? t.deviceAssignLanding
                    : animation.phase === 'SUCCESS'
                      ? t.deviceAssignSuccess
                      : animation.phase === 'ROLLING_BACK'
                        ? t.deviceAssignRollback
                        : errorMsg || t.errAssignDevice}
        </p>
      </div>

      <MissionGridFlyingDrone overlayRef={animation.overlayRef} />

      {/* Footer / Cancel Button for READY Missions */}
      {isReady && !disabled && (
        <div className="odm-mcard-footer">
          <button
            type="button"
            className="odm-btn odm-btn-danger-soft odm-mcard-block-btn"
            onClick={handleCancelMission}
            disabled={busy}
          >
            {t.cancelMission(mission.missionCode ?? '')}
          </button>
        </div>
      )}

      {isCancelled && (
        <div className="odm-mcard-stack">
          <div className="odm-mcard-cancelled-note">
            <strong>{t.cancelledPrefix}</strong>{' '}
            {mission.failureReason ||
              mission.rejectionReason ||
              t.cancelledDefault}
          </div>
        </div>
      )}
    </article>
  )
}
