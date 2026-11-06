import { useEffect, useMemo, useRef, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { droneApi } from '../../../../staff/api/droneApi'
import { managerHref } from '../../../routes'
import { missionsApi, toMissionCalendarItem } from '../../../api/missionsApi'
import { canAssignMissionDrone } from '../../../lib/missionDroneAssignments'
import type {
  MissionCalendarItem,
  MissionDeviceAssignmentResponse,
} from '../../../types/missions'
import type { DeviceResponse } from '../../../types/drones'

type DroneRole = MissionDeviceAssignmentResponse['deviceRole']

const COPY = {
  vi: {
    title: 'Gán drone vào nhiệm vụ',
    mission: 'Nhiệm vụ',
    chooseMission: 'Chọn nhiệm vụ cần gán',
    noMissions: 'Chưa có nhiệm vụ đủ điều kiện gán drone.',
    loadingMissions: 'Đang tải nhiệm vụ…',
    missionError: 'Không tải được danh sách nhiệm vụ.',
    retry: 'Tải lại',
    planning: 'Đang lập kế hoạch',
    ready: 'Sẵn sàng bay',
    role: 'Vai trò drone',
    main: 'Drone chính',
    support: 'Drone dự phòng',
    available: 'Có thể gán cho nhiệm vụ này.',
    checking: 'Đang kiểm tra drone khả dụng…',
    unavailable: 'Drone này hiện không khả dụng cho nhiệm vụ đã chọn.',
    availabilityError: 'Không kiểm tra được khả năng gán drone.',
    noMissionSelected: 'Chọn nhiệm vụ để kiểm tra khả năng gán drone.',
    assigned: 'Drone đã được gán vào nhiệm vụ này.',
    assignedDrones: 'Drone đang được gán',
    noneAssigned: 'Chưa có drone được gán.',
    replaceWarning: (name: string) =>
      `Gán drone chính mới sẽ thay ${name} khỏi nhiệm vụ.`,
    confirmReplace: 'Tôi xác nhận thay drone chính hiện tại.',
    assign: 'Gán drone',
    assigning: 'Đang gán…',
    success: 'Đã gán drone vào nhiệm vụ.',
    assignError: 'Không thể gán drone. Vui lòng thử lại.',
    backToMission: 'Về nhiệm vụ',
    missionStatus: 'Trạng thái',
  },
  en: {
    title: 'Assign drone to mission',
    mission: 'Mission',
    chooseMission: 'Choose a mission',
    noMissions: 'No missions are ready for drone assignment.',
    loadingMissions: 'Loading missions…',
    missionError: 'Could not load missions.',
    retry: 'Reload',
    planning: 'Planning',
    ready: 'Ready for flight',
    role: 'Drone role',
    main: 'Primary drone',
    support: 'Support drone',
    available: 'This drone is available for the selected mission.',
    checking: 'Checking drone availability…',
    unavailable: 'This drone is not available for the selected mission.',
    availabilityError: 'Could not check drone availability.',
    noMissionSelected: 'Choose a mission to check drone availability.',
    assigned: 'This drone is already assigned to this mission.',
    assignedDrones: 'Assigned drones',
    noneAssigned: 'No drones assigned yet.',
    replaceWarning: (name: string) =>
      `Assigning a new primary drone will replace ${name} on this mission.`,
    confirmReplace: 'I confirm replacing the current primary drone.',
    assign: 'Assign drone',
    assigning: 'Assigning…',
    success: 'Drone assigned to the mission.',
    assignError: 'Could not assign this drone. Please try again.',
    backToMission: 'Back to mission',
    missionStatus: 'Status',
  },
} as const

function isAssignableStatus(status?: string | null) {
  const normalized = status?.trim().toUpperCase()
  return !normalized || normalized === 'AVAILABLE'
}

function assignedDroneName(assignment: MissionDeviceAssignmentResponse) {
  return (
    assignment.deviceName ||
    assignment.deviceCode ||
    assignment.deviceSerialNumber ||
    assignment.deviceId
  )
}

function assignedDevicesFor(mission: MissionCalendarItem) {
  const assignments = mission.deviceAssignments ?? []
  if (assignments.length > 0 || !mission.droneId) return assignments
  return [
    {
      id: mission.droneAssignmentId ?? mission.droneId,
      deviceId: mission.droneId,
      deviceCode: mission.droneCode,
      deviceName: mission.droneName,
      deviceSerialNumber: null,
      deviceStatus: null,
      deviceRole: 'MAIN' as const,
      checkupStatus: 'PLANNING' as const,
      assignedAt: null,
    },
  ]
}

function missionLabel(
  mission: MissionCalendarItem,
  lang: string,
  copy: (typeof COPY)['vi'] | (typeof COPY)['en'],
) {
  const date = mission.scheduledStartAt
    ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(mission.scheduledStartAt))
    : ''
  const status = mission.status === 'PLANNING' ? copy.planning : copy.ready
  return [mission.missionCode, mission.orderCode, status, date]
    .filter(Boolean)
    .join(' · ')
}

export function DroneRoomAssignmentControl({
  drone,
  lang,
  assignmentMissionId,
  returnMissionId,
  onMissionChange,
  onAssignmentChanged,
}: {
  drone: DeviceResponse
  lang: string
  assignmentMissionId?: string
  returnMissionId?: string
  onMissionChange?: (missionId?: string) => void
  onAssignmentChanged?: (mission: MissionCalendarItem) => void
}) {
  const isEnglish = lang === 'en'
  const copy = isEnglish ? COPY.en : COPY.vi
  const [selectedMissionId, setSelectedMissionId] = useState(
    assignmentMissionId ?? '',
  )
  const missionReturnId = selectedMissionId || returnMissionId || assignmentMissionId
  const [missionSnapshot, setMissionSnapshot] =
    useState<MissionCalendarItem | null>(null)
  const [role, setRole] = useState<DroneRole>('MAIN')
  const [confirmedReplacement, setConfirmedReplacement] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const inFlight = useRef(false)
  const selectedDroneId = useRef(drone.id)

  const missionQuery = useApiQuery(
    (signal) => missionsApi.listMissions({ signal }),
    [],
  )
  const missions = useMemo(
    () => (missionQuery.data?.items ?? []).filter(canAssignMissionDrone),
    [missionQuery.data?.items],
  )
  const selectedMission =
    missionSnapshot?.id === selectedMissionId
      ? missionSnapshot
      : (missions.find((mission) => mission.id === selectedMissionId) ?? null)
  const availabilityQuery = useApiQuery(
    () =>
      selectedMissionId
        ? droneApi.getAvailable(selectedMissionId)
        : Promise.resolve([]),
    [selectedMissionId],
  )

  useEffect(() => {
    if (selectedDroneId.current === drone.id) return
    selectedDroneId.current = drone.id
    setRole('MAIN')
    setConfirmedReplacement(false)
    setError('')
    setNotice('')
  }, [drone.id])

  useEffect(() => {
    setSelectedMissionId(assignmentMissionId ?? '')
    setMissionSnapshot(null)
    setConfirmedReplacement(false)
  }, [assignmentMissionId])

  useEffect(() => {
    if (
      !assignmentMissionId ||
      missionQuery.loading ||
      missionQuery.error ||
      !missionQuery.data ||
      missions.some((mission) => mission.id === assignmentMissionId)
    )
      return
    setSelectedMissionId('')
    onMissionChange?.(undefined)
  }, [
    assignmentMissionId,
    missionQuery.error,
    missionQuery.loading,
    missions,
    onMissionChange,
  ])

  const assignedDevices = selectedMission
    ? assignedDevicesFor(selectedMission)
    : []
  const alreadyAssigned = assignedDevices.some(
    (assignment) => assignment.deviceId === drone.id,
  )
  const mainDrone = assignedDevices.find(
    (assignment) => assignment.deviceRole === 'MAIN',
  )
  const needsReplacementConfirmation = Boolean(
    role === 'MAIN' && mainDrone && mainDrone.deviceId !== drone.id,
  )
  const droneAvailable = (availabilityQuery.data ?? []).some(
    (availableDrone) =>
      availableDrone.id === drone.id &&
      isAssignableStatus(availableDrone.status),
  )

  function selectMission(missionId: string) {
    setSelectedMissionId(missionId)
    setMissionSnapshot(null)
    setConfirmedReplacement(false)
    setError('')
    setNotice('')
    onMissionChange?.(missionId || undefined)
  }

  async function assignDrone() {
    if (!selectedMission || saving || inFlight.current) return
    if (!droneAvailable || alreadyAssigned) return
    if (needsReplacementConfirmation && !confirmedReplacement) return

    inFlight.current = true
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await missionsApi.assignDevice(
        selectedMission.id,
        drone.id,
        role,
      )
      const updatedMission = toMissionCalendarItem(response)
      setMissionSnapshot(updatedMission)
      setConfirmedReplacement(false)
      setNotice(copy.success)
      onAssignmentChanged?.(updatedMission)
      missionQuery.reload()
      availabilityQuery.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.assignError)
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  const selectId = `drone-mission-select-${drone.id}`
  const roleId = `drone-role-select-${drone.id}`
  const needsMissionCheck = Boolean(
    selectedMissionId && availabilityQuery.loading,
  )
  const availabilityMessage = !selectedMissionId
    ? copy.noMissionSelected
    : availabilityQuery.loading
      ? copy.checking
      : availabilityQuery.error
        ? copy.availabilityError
        : alreadyAssigned
          ? copy.assigned
          : droneAvailable
            ? copy.available
            : copy.unavailable

  return (
    <section
      className="mgr-drone-room-assignment"
      aria-labelledby={`drone-assignment-title-${drone.id}`}
    >
      <div className="mgr-drone-room-assignment-heading">
        <h4 id={`drone-assignment-title-${drone.id}`}>{copy.title}</h4>
        {missionReturnId ? (
          <a
            href={managerHref({
              screen: 'missionDetail',
              missionId: missionReturnId,
            })}
          >
            {copy.backToMission}
          </a>
        ) : null}
      </div>

      <label htmlFor={selectId}>{copy.mission}</label>
      <select
        id={selectId}
        value={selectedMissionId}
        disabled={
          missionQuery.loading ||
          Boolean(missionQuery.error) ||
          missions.length === 0
        }
        onChange={(event) => selectMission(event.target.value)}
      >
        <option value="">{copy.chooseMission}</option>
        {missions.map((mission) => (
          <option key={mission.id} value={mission.id}>
            {missionLabel(mission, lang, copy)}
          </option>
        ))}
      </select>

      {missionQuery.loading && !missionQuery.data ? (
        <p className="mgr-drone-room-assignment-message" role="status">
          {copy.loadingMissions}
        </p>
      ) : missionQuery.error && !missionQuery.data ? (
        <div className="mgr-drone-room-assignment-error" role="alert">
          <span>
            {missionQuery.error instanceof Error
              ? missionQuery.error.message
              : copy.missionError}
          </span>
          <button type="button" onClick={missionQuery.reload}>
            {copy.retry}
          </button>
        </div>
      ) : missions.length === 0 ? (
        <p className="mgr-drone-room-assignment-message">{copy.noMissions}</p>
      ) : (
        <>
          {selectedMission ? (
            <div className="mgr-drone-room-assigned-summary">
              <span>{copy.assignedDrones}</span>
              {assignedDevices.length > 0 ? (
                <div>
                  {assignedDevices.map((assignment) => (
                    <span key={assignment.id}>
                      <strong>
                        {assignment.deviceRole === 'MAIN'
                          ? copy.main
                          : copy.support}
                        :
                      </strong>{' '}
                      {assignedDroneName(assignment)}
                    </span>
                  ))}
                </div>
              ) : (
                <small>{copy.noneAssigned}</small>
              )}
            </div>
          ) : null}

          <label htmlFor={roleId}>{copy.role}</label>
          <select
            id={roleId}
            value={role}
            disabled={!selectedMission || saving}
            onChange={(event) => {
              setRole(event.target.value as DroneRole)
              setConfirmedReplacement(false)
            }}
          >
            <option value="MAIN">{copy.main}</option>
            <option value="SUPPORT">{copy.support}</option>
          </select>

          {needsReplacementConfirmation && mainDrone ? (
            <div className="mgr-drone-room-replace-confirm">
              <p>{copy.replaceWarning(assignedDroneName(mainDrone))}</p>
              <label>
                <input
                  type="checkbox"
                  checked={confirmedReplacement}
                  disabled={saving}
                  onChange={(event) =>
                    setConfirmedReplacement(event.target.checked)
                  }
                />
                <span>{copy.confirmReplace}</span>
              </label>
            </div>
          ) : null}

          <p
            className={`mgr-drone-room-assignment-message${
              droneAvailable && !alreadyAssigned ? ' is-available' : ''
            }`}
            role={availabilityQuery.error ? 'alert' : 'status'}
            aria-live="polite"
          >
            {availabilityMessage}
          </p>

          {error ? (
            <p
              className="mgr-drone-room-assignment-feedback is-error"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <>
              <p
                className="mgr-drone-room-assignment-feedback is-success"
                role="status"
              >
                {notice}
              </p>
              {selectedMission ? (
                <a
                  className="mgr-drone-room-return-button"
                  href={managerHref({
                    screen: 'missionDetail',
                    missionId: selectedMission.id,
                  })}
                >
                  {copy.backToMission}
                </a>
              ) : null}
            </>
          ) : null}

          <button
            className="mgr-drone-room-assign-button"
            type="button"
            disabled={
              !selectedMission ||
              !droneAvailable ||
              alreadyAssigned ||
              needsMissionCheck ||
              Boolean(availabilityQuery.error) ||
              saving ||
              (needsReplacementConfirmation && !confirmedReplacement)
            }
            onClick={() => void assignDrone()}
          >
            {saving ? copy.assigning : copy.assign}
          </button>
        </>
      )}
    </section>
  )
}
