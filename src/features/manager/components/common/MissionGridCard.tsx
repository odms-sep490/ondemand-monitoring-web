import { CloseOutlined } from '@ant-design/icons'
import { useState } from 'react'
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
import { operatorApi, type AvailableOperator } from '../../../staff/api/operatorApi'
import { MissionUpdatePanel } from './MissionUpdatePanel'
import { STAFF_ROLE_LABELS } from './missionDetailHelpers'
import type { MissionStaffRole } from '../../../mission/types/mission'
import { useI18n } from '../../../../shared/i18n'
import { missionGridCardMessages } from './MissionGridCard.messages'
import './MissionGridCard.css'

interface MissionGridCardProps {
  mission: MissionResponse
  order: OrderDetail
  plan: ExecutionPlan
  orderChecklistItems: OrderChecklistSnapshot[]
  disabled: boolean
  onPlanChanged: () => void
  onRequestReason: (title: string, hint: string, onConfirm: (reason: string) => Promise<void>) => void
  onEditMission?: (mission: MissionResponse) => void
  onReplaceMission?: (mission: MissionResponse) => void
  onFinalizeReplacement?: (mission: MissionResponse) => void
  hasReplacement?: boolean
}

const ROLES: MissionStaffRole[] = ['PILOT', 'OPERATOR', 'MAINTAINER', 'INSPECTOR']

export function MissionGridCard({
  mission,
  order,
  plan,
  orderChecklistItems,
  disabled,
  onPlanChanged,
  onRequestReason,
  onEditMission,
  onReplaceMission,
  onFinalizeReplacement,
  hasReplacement,
}: MissionGridCardProps) {
  const { t } = useI18n(missionGridCardMessages)
  const isPlanning = mission.status === 'PLANNING'
  const isReady = mission.status === 'READY' || mission.status === 'WAITING_CREW_CONFIRMATION'
  const isCancelled = mission.status === 'CANCELLED'

  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Add Staff Popover state
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [availableOperators, setAvailableOperators] = useState<AvailableOperator[]>([])
  const [selectedStaffRole, setSelectedStaffRole] = useState<MissionStaffRole>('PILOT')
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [loadingStaff, setLoadingStaff] = useState(false)

  // Add Device Popover state
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [availableDrones, setAvailableDrones] = useState<AvailableDrone[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [selectedDeviceRole, setSelectedDeviceRole] = useState('MAIN')
  const [loadingDevices, setLoadingDevices] = useState(false)

  // Assigned checklists for this mission
  const scope = plan.missions.find((m) => m.missionId === mission.id)
  const assignedChecklistIds: string[] = scope?.checklistItemIds || []
  const assignedChecklists = orderChecklistItems.filter((item) =>
    assignedChecklistIds.includes(item.id),
  )

  // Staff and device counts
  const currentStaff = mission.staffAssignments || []
  const currentDevices = mission.deviceAssignments && mission.deviceAssignments.length > 0
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

  // 1. Remove Checklist Item (Click [X])
  async function handleRemoveChecklist(itemId: string) {
    if (disabled || busy || !isPlanning) return
    const remainingIds = assignedChecklistIds.filter((id: string) => id !== itemId)
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
    setSelectedStaffId('')
    setAvailableOperators([])
    setLoadingStaff(true)
    setErrorMsg('')
    try {
      const ops = await operatorApi.getAvailable(mission.id)
      setAvailableOperators(ops)
      if (ops.length > 0) setSelectedStaffId(ops[0].id)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t.errLoadStaff)
    } finally {
      setLoadingStaff(false)
    }
  }

  // Submit Add Staff
  async function handleConfirmAddStaff() {
    if (!selectedStaffId || busy) return
    const doAssign = async () => {
      setBusy(true)
      try {
        await missionsApi.assignStaff(mission.id, selectedStaffId, selectedStaffRole)
        setShowAddStaff(false)
        onPlanChanged()
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : t.errAssignStaff)
      } finally {
        setBusy(false)
      }
    }

    if (isReady) {
      onRequestReason(
        t.reasonAddStaffTitle,
        t.reasonAddStaffHint,
        async () => {
          await doAssign()
        },
      )
    } else {
      await doAssign()
    }
  }

  // Remove Staff
  function handleRemoveStaff(staffId: string, role: string) {
    if (disabled || busy) return
    const doRemove = async (reason?: string) => {
      setBusy(true)
      setErrorMsg('')
      try {
        await missionsApi.removeStaff(mission.id, staffId, role, reason)
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
        async (reason) => {
          await doRemove(reason)
        },
      )
    } else {
      void doRemove()
    }
  }

  // 3. Open Add Device
  async function handleOpenAddDevice() {
    setShowAddDevice(true)
    setShowAddStaff(false)
    setSelectedDeviceId('')
    setAvailableDrones([])
    setLoadingDevices(true)
    setErrorMsg('')
    try {
      const drones = await droneApi.getAvailable(mission.id)
      setAvailableDrones(drones)
      if (drones.length > 0) setSelectedDeviceId(drones[0].id)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t.errLoadDevices)
    } finally {
      setLoadingDevices(false)
    }
  }

  // Submit Add Device
  async function handleConfirmAddDevice() {
    if (!selectedDeviceId || busy) return
    const doAssign = async () => {
      setBusy(true)
      try {
        await missionsApi.assignDevice(mission.id, selectedDeviceId, selectedDeviceRole)
        setShowAddDevice(false)
        onPlanChanged()
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : t.errAssignDevice)
      } finally {
        setBusy(false)
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
      await doAssign()
    }
  }

  // Remove Device
  function handleRemoveDevice(deviceId: string) {
    if (disabled || busy) return
    const doRemove = async (reason?: string) => {
      setBusy(true)
      setErrorMsg('')
      try {
        await missionsApi.removeDevice(mission.id, deviceId, reason)
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
        async (reason) => {
          await doRemove(reason)
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

  const cardStatusClass = isCancelled
    ? 'is-cancelled'
    : isReady
    ? 'is-ready'
    : 'is-planning'

  return (
    <article className={`odm-mission-grid-card ${cardStatusClass}`} aria-label={mission.missionCode}>
      {/* Header */}
      <div className="odm-mcard-header">
        <div className="odm-mcard-title-group">
          <strong>
            <a href={managerHref({ screen: 'missionDetail', missionId: mission.id })}>
              {mission.missionCode || t.mission}
            </a>
          </strong>
          <span>{mission.orderTitle || t.orderScope}</span>
          {mission.replacesMissionId && (
            <span className="odm-mcard-replacement-tag">{t.replacementTag}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusBadge tone={toUiTone(missionStatusTone[mission.status] ?? 'gray')}>
            {missionStatusLabel[mission.status] ?? mission.status}
          </StatusBadge>
          {isPlanning && !disabled && (
            onEditMission ? (
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
            )
          )}
          {isCancelled && !disabled && !hasReplacement && onReplaceMission && (
            <button
              type="button"
              className="odm-btn odm-btn-sm odm-btn-p"
              disabled={disabled || busy}
              onClick={() => onReplaceMission(mission)}
              title={t.replaceTitle(mission.missionCode ?? '')}
            >
              {t.replace}
            </button>
          )}
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
          <span>{planningSchedule(mission.scheduledStartAt, mission.scheduledEndAt)}</span>
        </div>
      </div>

      {/* Work items Section */}
      <div className="odm-mcard-section">
        <div className="odm-mcard-sec-head">
          <span>{t.work(assignedChecklists.length)}</span>
        </div>
        <div className="odm-mcard-checklist-list">
          {assignedChecklists.length === 0 ? (
            <p className="odm-mission-meta" style={{ fontStyle: 'italic', margin: 0 }}>
              {t.workEmpty}
            </p>
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
          <span>{t.staffHead(currentStaff.length, maxStaff)}</span>
          {!isCancelled && !disabled && (
            <button
              type="button"
              className="odm-btn odm-btn-sm"
              onClick={handleOpenAddStaff}
              disabled={busy || currentStaff.length >= maxStaff}
            >
              {t.addShort}
            </button>
          )}
        </div>

        {/* Inline Add Staff Form */}
        {showAddStaff && (
          <div
            className="odm-mcard-inline-form"
            role="group"
            aria-label={t.addStaffAria}
            aria-busy={loadingStaff || busy}
          >
            <div className="odm-mcard-inline-form-heading">
              <strong>{t.addStaffTitle}</strong>
              <span>{t.addStaffHint}</span>
            </div>
            <div className="odm-mcard-inline-fields">
              <label className="odm-mcard-field">
                <span>{t.roleLabel}</span>
              <select
                aria-label={t.staffRoleAria}
                value={selectedStaffRole}
                onChange={(e) => setSelectedStaffRole(e.target.value as MissionStaffRole)}
                className="odm-input odm-input-sm"
                style={{ flex: 1 }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {STAFF_ROLE_LABELS[r] || r}
                  </option>
                ))}
              </select>
              </label>
              <label className="odm-mcard-field">
                <span>{t.staffLabel}</span>
              <select
                aria-label={t.staffAvailableAria}
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="odm-input odm-input-sm"
                style={{ flex: 2 }}
                disabled={loadingStaff || busy || availableOperators.length === 0}
              >
                {loadingStaff ? (
                  <option>{t.staffLoadingOption}</option>
                ) : availableOperators.length === 0 ? (
                  <option>{t.staffNoneOption}</option>
                ) : (
                  availableOperators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.fullName}
                    </option>
                  ))
                )}
              </select>
              </label>
            </div>
            <p className="odm-mcard-inline-form-hint" role={loadingStaff ? 'status' : undefined}>
              {loadingStaff
                ? t.staffLoadingHint
                : availableOperators.length > 0
                  ? t.staffCountHint(availableOperators.length)
                  : t.staffNoneHint}
            </p>
            <div className="odm-mcard-inline-actions">
              <button
                type="button"
                className="odm-btn odm-btn-sm"
                onClick={() => { setShowAddStaff(false); setErrorMsg('') }}
                disabled={busy}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-sm odm-btn-p"
                onClick={handleConfirmAddStaff}
                disabled={busy || loadingStaff || !selectedStaffId}
              >
                {t.save}
              </button>
            </div>
          </div>
        )}

        <div className="odm-mcard-res-list">
          {currentStaff.length === 0 ? (
            <p className="odm-mission-meta" style={{ fontStyle: 'italic', margin: 0 }}>
              {t.staffEmpty}
            </p>
          ) : (
            currentStaff.map((staff, idx) => (
              <div key={staff.id || `${staff.staffId}-${idx}`} className="odm-mcard-res-item">
                <div>
                  <span className="odm-mcard-res-role">
                    {STAFF_ROLE_LABELS[staff.assignedRole] || staff.assignedRole}:
                  </span>{' '}
                  <strong>{staff.staffName || t.staffUnnamed}</strong>
                </div>
                {!isCancelled && !disabled && (
                  <button
                    type="button"
                    className="odm-mcard-res-remove"
                    title={t.staffRemoveTitle}
                    aria-label={t.staffRemoveTitle}
                    onClick={() => handleRemoveStaff(staff.staffId, staff.assignedRole)}
                    disabled={busy}
                  >
                    <CloseOutlined aria-hidden="true" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
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

        {/* Inline Add Device Form */}
        {showAddDevice && (
          <div
            className="odm-mcard-inline-form"
            role="group"
            aria-label={t.addDeviceAria}
            aria-busy={loadingDevices || busy}
          >
            <div className="odm-mcard-inline-form-heading">
              <strong>{t.addDeviceTitle}</strong>
              <span>{t.addDeviceHint}</span>
            </div>
            <div className="odm-mcard-inline-fields">
              <select
                aria-label={t.deviceRoleAria}
                value={selectedDeviceRole}
                onChange={(e) => setSelectedDeviceRole(e.target.value)}
                className="odm-input odm-input-sm"
                style={{ flex: 1 }}
              >
                <option value="MAIN">{t.deviceMain}</option>
                <option value="SUPPORT">{t.deviceSupport}</option>
              </select>
              <select
                aria-label={t.deviceAvailableAria}
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="odm-input odm-input-sm"
                style={{ flex: 2 }}
                disabled={loadingDevices || busy || availableDrones.length === 0}
              >
                {loadingDevices ? (
                  <option>{t.deviceLoadingOption}</option>
                ) : availableDrones.length === 0 ? (
                  <option>{t.deviceNoneOption}</option>
                ) : (
                  availableDrones.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))
                )}
              </select>
            </div>
            <p className="odm-mcard-inline-form-hint" role={loadingDevices ? 'status' : undefined}>
              {loadingDevices
                ? t.deviceLoadingHint
                : availableDrones.length > 0
                  ? t.deviceCountHint(availableDrones.length)
                  : t.deviceNoneHint}
            </p>
            <div className="odm-mcard-inline-actions">
              <button
                type="button"
                className="odm-btn odm-btn-sm"
                onClick={() => { setShowAddDevice(false); setErrorMsg('') }}
                disabled={busy}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-sm odm-btn-p"
                onClick={handleConfirmAddDevice}
                disabled={busy || loadingDevices || !selectedDeviceId}
              >
                {t.save}
              </button>
            </div>
          </div>
        )}

        <div className="odm-mcard-res-list">
          {currentDevices.length === 0 ? (
            <p className="odm-mission-meta" style={{ fontStyle: 'italic', margin: 0 }}>
              {t.deviceEmpty}
            </p>
          ) : (
            currentDevices.map((dev, idx) => (
              <div key={dev.id || `${dev.deviceId}-${idx}`} className="odm-mcard-res-item">
                <div>
                  <span className="odm-mcard-res-role">
                    {dev.deviceRole === 'SUPPORT' ? t.deviceRoleShortSupport : t.deviceRoleShortMain}:
                  </span>{' '}
                  <strong>{dev.deviceName || dev.deviceCode || 'Drone'}</strong>
                </div>
                {!isCancelled && !disabled && (
                  <button
                    type="button"
                    className="odm-mcard-res-remove"
                    title={t.deviceRemoveTitle}
                    aria-label={t.deviceRemoveTitle}
                    onClick={() => handleRemoveDevice(dev.deviceId)}
                    disabled={busy}
                  >
                    <CloseOutlined aria-hidden="true" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer / Cancel Button for READY Missions */}
      {isReady && !disabled && (
        <div className="odm-mcard-footer">
          <button
            type="button"
            className="odm-btn odm-btn-danger-soft"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleCancelMission}
            disabled={busy}
          >
            {t.cancelMission(mission.missionCode ?? '')}
          </button>
        </div>
      )}

      {isPlanning && mission.replacesMissionId && plan.planStatus === 'FINALIZED' && !disabled && onFinalizeReplacement && (
        <div className="odm-mcard-footer">
          <button
            type="button"
            className="odm-btn odm-btn-p"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => onFinalizeReplacement(mission)}
            disabled={busy}
          >
            {t.finalizeMission}
          </button>
        </div>
      )}

      {isCancelled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="odm-mcard-cancelled-note">
            <strong>{t.cancelledPrefix}</strong> {mission.failureReason || mission.rejectionReason || t.cancelledDefault}
          </div>
          { !disabled && onReplaceMission ? (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => onReplaceMission(mission)}
              disabled={busy}
            >
              {t.replace}
            </button>
          ) : null}
        </div>
      )}
    </article>
  )
}
