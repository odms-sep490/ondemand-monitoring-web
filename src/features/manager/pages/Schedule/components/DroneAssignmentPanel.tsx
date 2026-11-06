import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { Button, Empty, Input, Skeleton } from 'antd'
import {
  CheckOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons'

import { missionsApi, toMissionCalendarItem } from '../../../api/missionsApi'
import type { MissionCalendarItem, MissionDeviceAssignmentResponse } from '../../../types/missions'
import { droneApi, type AvailableDrone } from '../../../../staff/api/droneApi'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import './droneAssignment.scss'

const DroneRoomScene = lazy(() =>
  import('../../Drones/components/DroneRoomScene').then((module) => ({
    default: module.DroneRoomScene,
  })),
)

const COPY = {
  vi: {
    title: 'Drone đã gán',
    noAssigned: 'Chưa có drone nào được gán cho nhiệm vụ này.',
    role: 'Vai trò của drone mới',
    main: 'Drone chính',
    support: 'Drone hỗ trợ',
    replaceWarning: (drone: string) => `Gán drone chính mới sẽ thay ${drone} hiện tại.`,
    confirmReplace: 'Tôi xác nhận thay drone chính hiện tại',
    choose: 'Chọn drone trong mô hình 3D hoặc danh sách',
    candidates: (count: number) => `${count} drone khả dụng`,
    search: 'Tìm theo mã hoặc model drone',
    loading: 'Đang tải drone khả dụng…',
    noCandidates: 'Không có drone khả dụng trong khung giờ này.',
    noSearch: 'Không tìm thấy drone phù hợp.',
    loadError: 'Chưa tải được danh sách drone. Hãy thử lại.',
    retry: 'Tải lại',
    select: 'Chọn drone để tiếp tục.',
    save: 'Gán drone',
    saving: 'Đang gán…',
    success: 'Đã cập nhật drone cho nhiệm vụ.',
    assignError: 'Không thể gán drone này. Hãy tải lại danh sách và thử lại.',
    available: 'Sẵn sàng',
    assigned: 'Đã gán',
    page: (from: number, to: number, total: number) => `${from}–${to} / ${total}`,
    previous: 'Trang drone trước',
    next: 'Trang drone tiếp theo',
    previewLoading: 'Đang dựng mô hình 3D…',
    previewHint: 'Mô hình dùng để chọn thiết bị; trạng thái khả dụng lấy từ hệ thống.',
    noWebgl: 'Không mở được mô hình 3D. Bạn vẫn có thể chọn drone từ danh sách bên dưới.',
    viewTitle: 'Khu vực chọn drone 3D',
  },
  en: {
    title: 'Assigned drones',
    noAssigned: 'No drone is assigned to this mission yet.',
    role: 'Role for the new drone',
    main: 'Main drone',
    support: 'Support drone',
    replaceWarning: (drone: string) => `The new main drone will replace ${drone}.`,
    confirmReplace: 'I confirm replacing the current main drone',
    choose: 'Choose a drone in the 3D view or the list',
    candidates: (count: number) => `${count} available drones`,
    search: 'Search by drone code or model',
    loading: 'Loading available drones…',
    noCandidates: 'No drones are available for this time slot.',
    noSearch: 'No matching drone found.',
    loadError: 'Could not load available drones. Try again.',
    retry: 'Retry',
    select: 'Choose a drone to continue.',
    save: 'Assign drone',
    saving: 'Assigning…',
    success: 'Drone assignment updated.',
    assignError: 'Could not assign this drone. Reload the list and try again.',
    available: 'Available',
    assigned: 'Assigned',
    page: (from: number, to: number, total: number) => `${from}–${to} / ${total}`,
    previous: 'Previous drone page',
    next: 'Next drone page',
    previewLoading: 'Preparing the 3D model…',
    previewHint: 'Select the model here; device availability comes from the system.',
    noWebgl: 'The 3D view could not start. You can still choose from the list below.',
    viewTitle: '3D drone selector',
  },
} as const

type DroneRole = MissionDeviceAssignmentResponse['deviceRole']

function isAssignable(drone: AvailableDrone) {
  const status = drone.status?.trim().toUpperCase()
  return !status || status === 'AVAILABLE'
}

function assignedDroneName(assignment: MissionDeviceAssignmentResponse) {
  return assignment.deviceName || assignment.deviceCode || assignment.deviceSerialNumber || assignment.deviceId
}

export function DroneAssignmentPanel({
  mission,
  canEdit,
  lang,
  onAssignmentChanged,
}: {
  mission: MissionCalendarItem
  canEdit: boolean
  lang: string
  onAssignmentChanged: (mission?: MissionCalendarItem) => void
}) {
  const isEnglish = lang === 'en'
  const copy = isEnglish ? COPY.en : COPY.vi
  const droneQuery = useApiQuery(
    () => canEdit ? droneApi.getAvailable(mission.id) : Promise.resolve([]),
    [mission.id, canEdit],
  )
  const [search, setSearch] = useState('')
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null)
  const [role, setRole] = useState<DroneRole>('MAIN')
  const [confirmedReplacement, setConfirmedReplacement] = useState(false)
  const [page, setPage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const inFlight = useRef(false)

  const assignedDevices = useMemo(() => {
    const persisted = mission.deviceAssignments ?? []
    if (persisted.length > 0 || !mission.droneId) return persisted
    return [{
      id: mission.droneAssignmentId ?? mission.droneId,
      deviceId: mission.droneId,
      deviceCode: mission.droneCode,
      deviceName: mission.droneName,
      deviceSerialNumber: null,
      deviceStatus: null,
      deviceRole: 'MAIN' as const,
      checkupStatus: 'PLANNING' as const,
      assignedAt: null,
    }]
  }, [mission.deviceAssignments, mission.droneAssignmentId, mission.droneCode, mission.droneId, mission.droneName])
  const assignedIds = useMemo(
    () => new Set(assignedDevices.map((assignment) => assignment.deviceId)),
    [assignedDevices],
  )
  const availableDrones = useMemo(
    () => (droneQuery.data ?? []).filter((drone) => isAssignable(drone) && !assignedIds.has(drone.id)),
    [assignedIds, droneQuery.data],
  )
  const filteredDrones = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(isEnglish ? 'en' : 'vi')
    if (!query) return availableDrones
    return availableDrones.filter((drone) => drone.label.toLocaleLowerCase(isEnglish ? 'en' : 'vi').includes(query))
  }, [availableDrones, isEnglish, search])
  const pageCount = Math.max(1, Math.ceil(filteredDrones.length / 6))
  const activePage = Math.min(page, pageCount - 1)
  const pageDrones = useMemo(
    () => filteredDrones.slice(activePage * 6, activePage * 6 + 6),
    [activePage, filteredDrones],
  )
  const selectedDrone = availableDrones.find((drone) => drone.id === selectedDroneId) ?? null
  const mainDrone = assignedDevices.find((assignment) => assignment.deviceRole === 'MAIN')
  const needsReplacementConfirmation = role === 'MAIN' && Boolean(mainDrone)

  const selectDrone = useCallback((droneId: string) => {
    setSelectedDroneId(droneId)
    setConfirmedReplacement(false)
    setError('')
    setNotice('')
  }, [])

  async function assignSelectedDrone() {
    if (!selectedDrone || saving || inFlight.current) {
      if (!selectedDrone) setError(copy.select)
      return
    }
    if (needsReplacementConfirmation && !confirmedReplacement) return

    inFlight.current = true
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await missionsApi.assignDevice(mission.id, selectedDrone.id, role)
      const updatedMission = toMissionCalendarItem(response)
      setSelectedDroneId(null)
      setConfirmedReplacement(false)
      setNotice(copy.success)
      onAssignmentChanged(updatedMission)
      droneQuery.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.assignError)
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  const from = filteredDrones.length === 0 ? 0 : activePage * 6 + 1
  const to = Math.min(filteredDrones.length, activePage * 6 + pageDrones.length)

  return (
    <div className="mgr-office-drone-assignment" aria-label={copy.viewTitle}>
      <section className="mgr-office-drone-assigned" aria-labelledby="mgr-office-drone-assigned-title">
        <div className="mgr-office-assignment-section-title">
          <strong id="mgr-office-drone-assigned-title">{copy.title}</strong>
          <span>{assignedDevices.length}</span>
        </div>
        {assignedDevices.length === 0 ? (
          <p className="mgr-office-assignment-muted">{copy.noAssigned}</p>
        ) : (
          <ul className="mgr-office-drone-assigned-list">
            {assignedDevices.map((assignment) => (
              <li className="mgr-office-drone-assigned-item" key={assignment.id}>
                <span className="mgr-office-drone-status-dot" aria-hidden="true" />
                <span className="mgr-office-drone-assigned-copy">
                  <strong>{assignedDroneName(assignment)}</strong>
                  <small>{assignment.deviceCode ?? assignment.deviceSerialNumber ?? assignment.deviceId}</small>
                </span>
                <span className="mgr-office-drone-role-tag">
                  {assignment.deviceRole === 'MAIN' ? copy.main : copy.support}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canEdit && (
        <>
          <div className="mgr-office-drone-role-field">
            <label htmlFor="mgr-office-drone-role">{copy.role}</label>
            <select
              id="mgr-office-drone-role"
              value={role}
              disabled={saving}
              onChange={(event) => {
                setRole(event.target.value as DroneRole)
                setConfirmedReplacement(false)
              }}
            >
              <option value="MAIN">{copy.main}</option>
              <option value="SUPPORT">{copy.support}</option>
            </select>
          </div>

          {needsReplacementConfirmation && mainDrone && (
            <div className="mgr-office-drone-replace-confirm">
              <p>{copy.replaceWarning(assignedDroneName(mainDrone))}</p>
              <label>
                <input
                  type="checkbox"
                  checked={confirmedReplacement}
                  disabled={saving}
                  onChange={(event) => setConfirmedReplacement(event.target.checked)}
                />
                <span>{copy.confirmReplace}</span>
              </label>
            </div>
          )}

          <section className="mgr-office-drone-picker" aria-labelledby="mgr-office-drone-picker-title">
            <div className="mgr-office-drone-picker-heading">
              <strong id="mgr-office-drone-picker-title">{copy.choose}</strong>
              <span>{copy.candidates(availableDrones.length)}</span>
            </div>

            <div className="mgr-office-drone-picker-content">
              <div className="mgr-office-drone-scene-column">
                <Suspense
                  fallback={
                    <div className="mgr-office-drone-scene-loading" role="status">
                      {copy.previewLoading}
                    </div>
                  }
                >
                  <DroneRoomScene
                    drones={pageDrones}
                    selectedDroneId={selectedDroneId}
                    onSelect={selectDrone}
                    label={copy.viewTitle}
                    fallbackMessage={copy.noWebgl}
                    loadingMessage={copy.previewLoading}
                  />
                </Suspense>
                <p className="mgr-office-drone-picker-hint">{copy.previewHint}</p>
              </div>

              <div className="mgr-office-drone-candidates-column">
                <Input
                  allowClear
                  prefix={<SearchOutlined aria-hidden="true" />}
                  value={search}
                  placeholder={copy.search}
                  aria-label={copy.search}
                  disabled={saving}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(0)
                    setSelectedDroneId(null)
                  }}
                />

                {pageCount > 1 && (
                  <div className="mgr-office-drone-pagination">
                    <Button
                      type="text"
                      aria-label={copy.previous}
                      disabled={activePage === 0 || saving}
                      onClick={() => {
                        setPage(activePage - 1)
                        setSelectedDroneId(null)
                      }}
                      icon={<LeftOutlined aria-hidden="true" />}
                    />
                    <span>{copy.page(from, to, filteredDrones.length)}</span>
                    <Button
                      type="text"
                      aria-label={copy.next}
                      disabled={activePage >= pageCount - 1 || saving}
                      onClick={() => {
                        setPage(activePage + 1)
                        setSelectedDroneId(null)
                      }}
                      icon={<RightOutlined aria-hidden="true" />}
                    />
                  </div>
                )}

                {droneQuery.loading ? (
                  <div className="mgr-office-drone-fetch-state" role="status" aria-busy="true">
                    <Skeleton active title={false} paragraph={{ rows: 2 }} />
                    <span>{copy.loading}</span>
                  </div>
                ) : droneQuery.error ? (
                  <div className="mgr-office-drone-fetch-error" role="alert">
                    <span>{droneQuery.error instanceof Error ? droneQuery.error.message : copy.loadError}</span>
                    <Button icon={<ReloadOutlined aria-hidden="true" />} onClick={droneQuery.reload}>
                      {copy.retry}
                    </Button>
                  </div>
                ) : availableDrones.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.noCandidates} />
                ) : filteredDrones.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.noSearch} />
                ) : (
                  <div className="mgr-office-drone-candidate-list" role="list" aria-label={copy.choose}>
                    {pageDrones.map((drone) => {
                      const isSelected = selectedDroneId === drone.id
                      return (
                        <div role="listitem" key={drone.id}>
                          <button
                            type="button"
                            className={`mgr-office-drone-candidate${isSelected ? ' is-selected' : ''}`}
                            aria-pressed={isSelected}
                            disabled={saving}
                            onClick={() => selectDrone(drone.id)}
                          >
                            <span className="mgr-office-drone-candidate-mark" aria-hidden="true" />
                            <span className="mgr-office-drone-candidate-copy">
                              <strong>{drone.label}</strong>
                              <small>{copy.available}</small>
                            </span>
                            {isSelected && <CheckOutlined aria-hidden="true" />}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {error && <p className="mgr-office-assignment-message is-error" role="alert">{error}</p>}
          {notice && <p className="mgr-office-assignment-message is-success" role="status">{notice}</p>}
          {availableDrones.length > 0 && (
            <Button
              type="primary"
              icon={<CheckOutlined aria-hidden="true" />}
              loading={saving}
              disabled={
                saving ||
                !selectedDrone ||
                (needsReplacementConfirmation && !confirmedReplacement)
              }
              onClick={() => void assignSelectedDrone()}
              block
            >
              {saving ? copy.saving : copy.save}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
