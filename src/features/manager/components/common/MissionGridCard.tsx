import {
  ApartmentOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  SendOutlined,
} from '@ant-design/icons'
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
import { getVisibleMissionStaffAssignments } from '../../lib/missionStaffAssignments'
import { canAssignMissionDrone } from '../../lib/missionDroneAssignments'
import { droneApi, type AvailableDrone } from '../../../staff/api/droneApi'
import { MissionUpdatePanel } from './MissionUpdatePanel'
import {
  MissionGridDeviceList,
  MissionGridStaffList,
} from './MissionGridResourceLists'
import { MissionGridAddDeviceForm } from './MissionGridAddDeviceForm'
import { MissionGridFlyingDrone } from './MissionGridDroneSprite'
import { useDroneAssignmentAnimation } from './useDroneAssignmentAnimation'
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
  const assignedStaff = getVisibleMissionStaffAssignments(
    mission.status,
    mission.staffAssignments,
  )
  const assignedStaffCount = new Set(
    assignedStaff.map((assignment) => assignment.staffId),
  ).size
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
  const assignedDeviceIds = new Set(
    currentDevices
      .map((assignment) => assignment.deviceId)
      .filter((deviceId): deviceId is string => Boolean(deviceId)),
  )
  const assignableDrones = availableDrones.filter(
    (drone) => !assignedDeviceIds.has(drone.id),
  )
  const maxStaff = 10
  const maxDevices = 10

  // 1. Remove Checklist Item (Click [X])
  async function handleRemoveChecklist(itemId: string) {
    if (disabled || busy || !isPlanning || mission.purpose === 'REWORK') return
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

  // 3. Open Add Device
  async function handleOpenAddDevice() {
    const missionId = mission.id
    const requestId = ++deviceLoadAttemptRef.current
    setShowAddDevice(true)
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
          {mission.purpose === 'REWORK' && (
            <StatusBadge tone="warning">{t.rework}</StatusBadge>
          )}
          <StatusBadge
            tone={toUiTone(missionStatusTone[mission.status] ?? 'gray')}
          >
            {missionStatusLabel[mission.status] ?? mission.status}
          </StatusBadge>
          {isPlanning &&
            mission.purpose !== 'REWORK' &&
            plan.planStatus === 'FINALIZED' &&
            !disabled && (
              <button
                type="button"
                className="odm-btn odm-btn-sm odm-btn-p"
                disabled={busy}
                onClick={() => void handleConfirmPlanning()}
                title={t.confirmMissionTitle(mission.missionCode ?? '')}
              >
                {busy ? t.confirmingMission : t.confirmMission}
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
                {isPlanning && mission.purpose !== 'REWORK' && (
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
        <div className="odm-mcard-sec-head odm-mcard-staff-head">
          <span>{t.staffHead(assignedStaffCount, maxStaff)}</span>
          <div className="odm-mcard-staff-actions">
            <a
              href={managerHref({
                screen: 'schedule',
                assignmentMissionId: mission.id,
                assignmentCanEdit: !disabled && !isCancelled,
                assignmentReturnOrderId: order.id,
              })}
              className="odm-mcard-office-link"
              title={
                disabled || isCancelled
                  ? t.office3dViewLinkTitle
                  : t.office3dLinkTitle
              }
            >
              <ApartmentOutlined aria-hidden="true" />
              <span>
                {disabled || isCancelled ? t.office3dViewLink : t.office3dLink}
              </span>
              <ArrowRightOutlined aria-hidden="true" />
            </a>
          </div>
        </div>

        <MissionGridStaffList
          t={t}
          staff={assignedStaff}
        />
      </div>

      {/* Device Section */}
      <div className="odm-mcard-section">
        <div className="odm-mcard-sec-head odm-mcard-staff-head">
          <span>{t.deviceHead(currentDevices.length, maxDevices)}</span>
          <div className="odm-mcard-staff-actions">
            {!disabled && canAssignMissionDrone(mission) && (
              <a
                href={managerHref({
                  screen: 'drones',
                  assignmentMissionId: mission.id,
                })}
                className="odm-mcard-office-link"
                title={t.droneTeamLinkTitle}
              >
                <SendOutlined aria-hidden="true" />
                <span>{t.droneTeamLink}</span>
                <ArrowRightOutlined aria-hidden="true" />
              </a>
            )}
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
            drones={assignableDrones}
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
