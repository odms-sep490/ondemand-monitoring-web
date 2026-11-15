import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeftOutlined,
  ApartmentOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, Empty, Input, Popconfirm, Skeleton, Tag } from 'antd'

import { missionsApi, toMissionCalendarItem } from '../../../api/missionsApi'
import { getVisibleMissionStaffAssignments } from '../../../lib/missionStaffAssignments'
import type { MissionCalendarItem, MissionStaffAssignmentResponse } from '../../../types/missions'
import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import './officeMissionAssignment.scss'

type StaffRole = MissionStaffAssignmentResponse['assignedRole']

const STAFF_ROLES: StaffRole[] = ['PILOT', 'OPERATOR', 'MAINTAINER', 'INSPECTOR']
const MAX_STAFF = 10

const COPY = {
  vi: {
    title: 'Phân công nhân sự',
    assignmentFor: 'Đang phân công cho',
    loading: 'Đang tải thông tin nhiệm vụ…',
    missionMissing: 'Không tìm thấy nhiệm vụ này.',
    canceled: 'Nhiệm vụ đã hủy nên không thể thay đổi phân công.',
    readOnly: 'Nhiệm vụ hiện chỉ xem được. Quay lại bước lập kế hoạch để tiếp tục phân công.',
    assigned: 'Đã phân công',
    staff: (count: number) => `${count}/${MAX_STAFF} nhân sự`,
    noStaff: 'Chưa có nhân sự được phân công.',
    assignmentTools: 'Phân công thêm',
    replacementTitle: 'Thay thế nhân sự',
    replacementTarget: 'Nhân sự cần thay',
    replacementTargetMissing: 'Không tìm thấy nhân sự đang từ chối trong nhiệm vụ này.',
    replacementReason: 'Nhân sự đã từ chối nhiệm vụ',
    replaceSave: 'Xác nhận thay thế',
    replacementSuccess: 'Đã thay thế nhân sự. Đang chờ người mới xác nhận.',
    replacementError: 'Không thể thay thế nhân sự.',
    addStaff: 'Thêm nhân sự',
    closeCandidates: 'Thu gọn',
    returnToMission: 'Quay lại nhiệm vụ',
    removeRole: 'Gỡ vai trò này khỏi nhiệm vụ?',
    remove: 'Gỡ',
    cancel: 'Giữ lại',
    search: 'Tìm nhân sự theo tên hoặc email',
    candidates: 'Nhân sự có thể phân công',
    noCandidates: 'Hiện không có nhân sự khả dụng.',
    noSearch: 'Không tìm thấy nhân sự phù hợp.',
    capacity: 'Nhiệm vụ đã đủ 10 nhân sự.',
    selectStaff: 'Chọn một nhân sự để phân công',
    roles: 'Vai trò trong nhiệm vụ',
    alreadyAssigned: 'Đã có vai trò này',
    save: 'Lưu phân công',
    saving: 'Đang lưu…',
    selectRole: 'Chọn ít nhất một vai trò trước khi lưu.',
    success: 'Đã cập nhật phân công nhân sự.',
    missingSavedAssignment: 'Máy chủ chưa trả về phân công vừa lưu. Hãy tải lại nhiệm vụ để kiểm tra.',
    assignError: 'Không thể phân công nhân sự.',
    removeError: 'Không thể gỡ vai trò này.',
    rolesLabel: {
      PILOT: 'Phi công',
      OPERATOR: 'Vận hành',
      MAINTAINER: 'Bảo trì',
      INSPECTOR: 'Nghiệm thu',
    },
    verified: 'Đã nhận nhiệm vụ',
    pending: 'Chờ phản hồi',
    declined: 'Đã từ chối',
  },
  en: {
    title: 'Staff assignment',
    assignmentFor: 'Assigning to',
    loading: 'Loading mission details…',
    missionMissing: 'This mission could not be found.',
    canceled: 'This mission is cancelled, so assignments cannot be changed.',
    readOnly: 'This mission is view-only. Return to planning to continue staff assignment.',
    assigned: 'Assigned staff',
    staff: (count: number) => `${count}/${MAX_STAFF} staff`,
    noStaff: 'No staff assigned yet.',
    assignmentTools: 'Add assignment',
    replacementTitle: 'Replace staff',
    replacementTarget: 'Staff being replaced',
    replacementTargetMissing: 'The declined staff member could not be found on this mission.',
    replacementReason: 'Staff declined the mission',
    replaceSave: 'Confirm replacement',
    replacementSuccess: 'Staff replaced. Waiting for the new staff member to confirm.',
    replacementError: 'Could not replace this staff member.',
    addStaff: 'Add staff',
    closeCandidates: 'Hide staff picker',
    returnToMission: 'Back to mission',
    removeRole: 'Remove this role from the mission?',
    remove: 'Remove',
    cancel: 'Keep',
    search: 'Search staff by name or email',
    candidates: 'Available staff',
    noCandidates: 'No staff are currently available.',
    noSearch: 'No matching staff found.',
    capacity: 'This mission already has 10 staff.',
    selectStaff: 'Select a staff member to assign',
    roles: 'Mission roles',
    alreadyAssigned: 'Already assigned',
    save: 'Save assignment',
    saving: 'Saving…',
    selectRole: 'Choose at least one role before saving.',
    success: 'Staff assignment updated.',
    missingSavedAssignment: 'The server did not return the saved assignment. Reload the mission to verify it.',
    assignError: 'Could not assign this staff member.',
    removeError: 'Could not remove this role.',
    rolesLabel: {
      PILOT: 'Pilot',
      OPERATOR: 'Operator',
      MAINTAINER: 'Maintenance',
      INSPECTOR: 'Inspector',
    },
    verified: 'Accepted mission',
    pending: 'Awaiting response',
    declined: 'Declined',
  },
} as const

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function OfficeMissionAssignmentPanel({
  mission,
  candidates,
  loading,
  canEdit,
  replacementStaffId,
  returnToHref,
  lang,
  selectedStaffId,
  onSelectedStaffChange,
  onAssignmentChanged,
  onStaffFocus,
}: {
  mission: MissionCalendarItem | null
  candidates: AvailableOperator[]
  loading: boolean
  canEdit: boolean
  replacementStaffId?: string
  returnToHref?: string
  lang: string
  selectedStaffId: string | null
  onSelectedStaffChange: (staffId: string | null) => void
  onAssignmentChanged: (mission?: MissionCalendarItem) => void
  onStaffFocus: (staffId: string) => void
}) {
  const isEnglish = lang === 'en'
  const copy = isEnglish ? COPY.en : COPY.vi
  const [search, setSearch] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<StaffRole[]>([])
  const [assignmentEditor, setAssignmentEditor] = useState(() => ({
    missionId: mission?.id ?? null,
    open: getVisibleMissionStaffAssignments(
      mission?.status,
      mission?.staffAssignments,
    ).length === 0 ||
      mission?.staffAssignments?.some(
        (assignment) => assignment.responseStatus === 'REJECTED',
      ) === true,
  }))
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const preserveNoticeOnSelectionChange = useRef(false)
  const selectedCandidateRef = useRef<HTMLButtonElement | null>(null)

  const assignments = useMemo(
    () =>
      getVisibleMissionStaffAssignments(mission?.status, mission?.staffAssignments),
    [mission?.status, mission?.staffAssignments],
  )
  const currentDeclinedStaffIds = [
    ...new Set(
      (mission?.staffAssignments ?? [])
        .filter(
          (assignment) =>
            assignment.responseStatus === 'REJECTED' &&
            assignment.isCurrent !== false,
        )
        .map((assignment) => assignment.staffId),
    ),
  ]
  const automaticReplacementStaffId =
    mission &&
    !['PLANNING', 'CANCELLED', 'FAILED'].includes(mission.status) &&
    currentDeclinedStaffIds.length === 1
      ? currentDeclinedStaffIds[0]
      : undefined
  const activeReplacementStaffId =
    replacementStaffId ?? automaticReplacementStaffId
  const replacementAssignments = useMemo(() => {
    if (!activeReplacementStaffId) return []
    const currentAssignments = (mission?.staffAssignments ?? []).filter(
      (assignment) =>
        assignment.staffId === activeReplacementStaffId &&
        assignment.isCurrent !== false,
    )
    return currentAssignments.some(
      (assignment) => assignment.responseStatus === 'REJECTED',
    )
      ? currentAssignments
      : []
  }, [activeReplacementStaffId, mission?.staffAssignments])
  const isReplacementMode = Boolean(activeReplacementStaffId)
  const replacementTargetName =
    replacementAssignments[0]?.staffName?.trim() ||
    replacementAssignments[0]?.staffEmail ||
    (isEnglish ? 'Unknown staff' : 'Chưa rõ tên')
  const replacementRoles = new Set(
    replacementAssignments.map((assignment) => assignment.assignedRole),
  )
  const staffGroups = useMemo(() => {
    const groups = new Map<string, MissionStaffAssignmentResponse[]>()
    assignments.forEach((assignment) => {
      const group = groups.get(assignment.staffId) ?? []
      group.push(assignment)
      groups.set(assignment.staffId, group)
    })
    return [...groups.entries()]
  }, [assignments])
  const hasDeclinedStaff = assignments.some(
    (assignment) => assignment.responseStatus === 'REJECTED',
  )
  const assignedRoles = useMemo(() => {
    const roles = new Map<string, Set<StaffRole>>()
    assignments.forEach((assignment) => {
      const current = roles.get(assignment.staffId) ?? new Set<StaffRole>()
      current.add(assignment.assignedRole)
      roles.set(assignment.staffId, current)
    })
    return roles
  }, [assignments])
  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return candidates
    return candidates.filter(({ fullName, email }) =>
      `${fullName} ${email}`.toLocaleLowerCase().includes(query),
    )
  }, [candidates, search])

  useEffect(() => {
    setSelectedRoles((current) => (current.length ? [] : current))
    setError((current) => (current ? '' : current))
    if (preserveNoticeOnSelectionChange.current) {
      preserveNoticeOnSelectionChange.current = false
      return
    }
    setNotice((current) => (current ? '' : current))
  }, [selectedStaffId])

  const previousReplacementMode = useRef(false)
  useEffect(() => {
    if (isReplacementMode && !previousReplacementMode.current) {
      setError('')
      setNotice('')
    }
    previousReplacementMode.current = isReplacementMode
  }, [isReplacementMode])

  useEffect(() => {
    const selectedIsAvailable = candidates.some((staff) => staff.id === selectedStaffId)
    const selectedIsVisible = filteredCandidates.some((staff) => staff.id === selectedStaffId)
    if (selectedStaffId && selectedIsAvailable && !selectedIsVisible) {
      setSearch('')
      return
    }
    selectedCandidateRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedStaffId, candidates, filteredCandidates])

  const selectedStaff = candidates.find((staff) => staff.id === selectedStaffId)
  const selectedAssignedRoles = selectedStaffId
    ? assignedRoles.get(selectedStaffId) ?? new Set<StaffRole>()
    : new Set<StaffRole>()
  const activeStaffCount = staffGroups.filter(
    ([, assignments]) =>
      !assignments.some((assignment) => assignment.responseStatus === 'REJECTED'),
  ).length
  const staffLimitReached = activeStaffCount >= MAX_STAFF
  const isEditable = Boolean(canEdit && mission && mission.status !== 'CANCELLED')
  const currentMissionId = mission?.id ?? null
  const assignmentEditorOpen = Boolean(selectedStaffId) || (
    assignmentEditor.missionId === currentMissionId
      ? assignmentEditor.open
      : staffGroups.length === 0 || hasDeclinedStaff
  )

  function setAssignmentEditorOpen(open: boolean) {
    setAssignmentEditor({ missionId: currentMissionId, open })
    if (!open) {
      onSelectedStaffChange(null)
      setSelectedRoles([])
    }
  }

  function selectStaff(staff: AvailableOperator) {
    setAssignmentEditorOpen(true)
    onSelectedStaffChange(staff.id)
    setSelectedRoles([])
    setError('')
    setNotice('')
    onStaffFocus(staff.id)
  }

  async function saveAssignment() {
    if (!mission || !selectedStaffId || saving) return
    if (isReplacementMode && replacementAssignments.length === 0) {
      setError(copy.replacementTargetMissing)
      return
    }
    if (!isReplacementMode && selectedRoles.length === 0) {
      setError(copy.selectRole)
      return
    }

    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = isReplacementMode
        ? await missionsApi.replaceStaff(
            mission.id,
            activeReplacementStaffId!,
            selectedStaffId,
            replacementAssignments.find((assignment) => assignment.declineReason?.trim())
              ?.declineReason?.trim() ?? copy.replacementReason,
          )
        : await missionsApi.assignStaff(mission.id, selectedStaffId, selectedRoles)
      const updatedMission = toMissionCalendarItem(response)
      const expectedRoles = isReplacementMode
        ? replacementRoles
        : new Set(selectedRoles)
      const savedRoles = new Set(
        getVisibleMissionStaffAssignments(
          updatedMission.status,
          updatedMission.staffAssignments,
        )
          .filter((assignment) => assignment.staffId === selectedStaffId)
          .map((assignment) => assignment.assignedRole) ?? [],
      )
      if (
        expectedRoles.size === 0 ||
        [...expectedRoles].some((role) => !savedRoles.has(role))
      ) {
        throw new Error(copy.missingSavedAssignment)
      }
      preserveNoticeOnSelectionChange.current = true
      setAssignmentEditorOpen(false)
      setNotice(isReplacementMode ? copy.replacementSuccess : copy.success)
      onAssignmentChanged(updatedMission)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : isReplacementMode
            ? copy.replacementError
            : copy.assignError,
      )
    } finally {
      setSaving(false)
    }
  }

  async function removeAssignment(assignmentId: string) {
    if (!mission || removingId || saving) return
    setRemovingId(assignmentId)
    setError('')
    setNotice('')
    try {
      const updatedMission = toMissionCalendarItem(
        await missionsApi.removeStaff(mission.id, assignmentId),
      )
      setNotice(copy.success)
      onAssignmentChanged(updatedMission)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.removeError)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section
      className="mgr-office-rail-card mgr-office-assignment-card"
      aria-label={isReplacementMode ? copy.replacementTitle : copy.title}
    >
      <div className="mgr-office-rail-title">
        <div>
          <span className="mgr-office-title-icon"><ApartmentOutlined /></span>
          <h3>{isReplacementMode ? copy.replacementTitle : copy.title}</h3>
        </div>
        <Tag>{copy.staff(staffGroups.length)}</Tag>
      </div>

      {loading && !mission ? (
        <div className="mgr-office-assignment-loading" aria-busy="true">
          <Skeleton active title={false} paragraph={{ rows: 3 }} />
          <span>{copy.loading}</span>
        </div>
      ) : !mission ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.missionMissing} />
      ) : (
        <div className="mgr-office-assignment-body">
          <div className="mgr-office-assignment-context">
            <TeamOutlined aria-hidden="true" />
            <span>{copy.assignmentFor}</span>
            <strong>{mission.missionCode}</strong>
          </div>

          {mission.status === 'CANCELLED' && (
            <p className="mgr-office-assignment-muted" role="status">{copy.canceled}</p>
          )}
          {mission.status !== 'CANCELLED' && !canEdit && (
            <p className="mgr-office-assignment-muted" role="status">{copy.readOnly}</p>
          )}

          <div className="mgr-office-assignment-section">
            <div className="mgr-office-assignment-section-title">
              <strong>{copy.assigned}</strong>
              <span>{copy.staff(staffGroups.length)}</span>
            </div>
            {staffGroups.length === 0 ? (
              <p className="mgr-office-assignment-muted">{copy.noStaff}</p>
            ) : (
              <div className="mgr-office-assigned-list">
                {staffGroups.map(([staffId, items]) => {
                  const name = items[0]?.staffName?.trim() || (isEnglish ? 'Unknown staff' : 'Chưa rõ tên')
                  const responseStatus = items.some((item) => item.responseStatus === 'REJECTED')
                    ? 'declined'
                    : items.every((item) => item.responseStatus === 'ACCEPTED')
                      ? 'verified'
                      : 'pending'
                  return (
                    <div className="mgr-office-assigned-person" key={staffId}>
                      <button
                        type="button"
                        className="mgr-office-assigned-person-main"
                        onClick={() => onStaffFocus(staffId)}
                        aria-label={`${name} · ${copy.rolesLabel[items[0].assignedRole]}`}
                      >
                        <span className="mgr-office-assignment-avatar">{initials(name)}</span>
                        <span className="mgr-office-assigned-person-copy">
                          <strong>{name}</strong>
                          <small>{items[0]?.staffEmail || ''}</small>
                        </span>
                      </button>
                      <span className={`mgr-office-assignment-response is-${responseStatus}`}>
                        {copy[responseStatus]}
                      </span>
                      <div className="mgr-office-assigned-roles">
                        {items.map((assignment) => (
                          <span className="mgr-office-assigned-role" key={assignment.id}>
                            {copy.rolesLabel[assignment.assignedRole]}
                            {isEditable && (
                              <Popconfirm
                                title={copy.removeRole}
                                okText={copy.remove}
                                cancelText={copy.cancel}
                                onConfirm={() => void removeAssignment(assignment.id)}
                              >
                                <button
                                  type="button"
                                  aria-label={`${copy.remove}: ${copy.rolesLabel[assignment.assignedRole]} · ${name}`}
                                  title={copy.removeRole}
                                  disabled={Boolean(removingId || saving)}
                                >
                                  <CloseOutlined aria-hidden="true" />
                                </button>
                              </Popconfirm>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {isEditable && (
            <div className="mgr-office-assignment-section">
              <div className="mgr-office-assignment-section-title">
                <strong>
                  <UserAddOutlined aria-hidden="true" />{' '}
                  {isReplacementMode ? copy.replacementTitle : copy.assignmentTools}
                </strong>
                <Button
                  type="text"
                  size="small"
                  icon={assignmentEditorOpen
                    ? <CloseOutlined aria-hidden="true" />
                    : <UserAddOutlined aria-hidden="true" />}
                  aria-expanded={assignmentEditorOpen}
                  onClick={() => setAssignmentEditorOpen(!assignmentEditorOpen)}
                  disabled={saving}
                >
                  {assignmentEditorOpen
                    ? copy.closeCandidates
                    : isReplacementMode
                      ? copy.replacementTitle
                      : copy.addStaff}
                </Button>
              </div>
              {assignmentEditorOpen && (
                <>
                  {isReplacementMode && !replacementAssignments.length && (
                    <p className="mgr-office-assignment-message is-error" role="alert">
                      {copy.replacementTargetMissing}
                    </p>
                  )}
                  {staffLimitReached && !selectedStaffId && (
                    <p className="mgr-office-assignment-muted">{copy.capacity}</p>
                  )}
                  <Input
                    allowClear
                    prefix={<SearchOutlined aria-hidden="true" />}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={copy.search}
                    aria-label={copy.search}
                    disabled={loading || saving}
                  />

                  {loading ? (
                    <div className="mgr-office-assignment-candidate-state" role="status">
                      {copy.loading}
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="mgr-office-assignment-candidate-state">{copy.noCandidates}</div>
                  ) : filteredCandidates.length === 0 ? (
                    <div className="mgr-office-assignment-candidate-state">{copy.noSearch}</div>
                  ) : (
                    <div className="mgr-office-assignment-candidates" role="list" aria-label={copy.candidates}>
                      {filteredCandidates.map((candidate) => {
                        const isAssigned = assignedRoles.has(candidate.id)
                        const atCapacity =
                          staffLimitReached && !isAssigned && !isReplacementMode
                        const isSelected = selectedStaffId === candidate.id
                        return (
                          <button
                            type="button"
                            role="listitem"
                            key={candidate.id}
                            ref={isSelected ? selectedCandidateRef : undefined}
                            className={'mgr-office-assignment-candidate' + (isSelected ? ' is-selected' : '')}
                            onClick={() => selectStaff(candidate)}
                            disabled={atCapacity || saving}
                            aria-pressed={isSelected}
                          >
                            <span className="mgr-office-assignment-avatar">{initials(candidate.fullName)}</span>
                            <span className="mgr-office-assignment-candidate-copy">
                              <strong>{candidate.fullName}</strong>
                              <small>{candidate.email}</small>
                            </span>
                            {isSelected ? <CheckOutlined aria-hidden="true" /> : isAssigned ? <Tag>{copy.alreadyAssigned}</Tag> : null}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {selectedStaff && (
                    <div className="mgr-office-assignment-role-picker">
                      <div className="mgr-office-assignment-section-title">
                        <strong>{isReplacementMode ? copy.replacementTarget : copy.roles}</strong>
                        <span>
                          {isReplacementMode
                            ? `${replacementTargetName} → ${selectedStaff.fullName}`
                            : selectedStaff.fullName}
                        </span>
                      </div>
                      {isReplacementMode ? (
                        <p className="mgr-office-assignment-muted">
                          {[...replacementRoles]
                            .map((role) => copy.rolesLabel[role])
                            .join(', ')}
                        </p>
                      ) : (
                        <div className="mgr-office-assignment-role-options">
                          {STAFF_ROLES.map((role) => {
                            const assigned = selectedAssignedRoles.has(role)
                            const checked = assigned || selectedRoles.includes(role)
                            return (
                              <Checkbox
                                key={role}
                                checked={checked}
                                disabled={assigned || saving}
                                onChange={(event) => {
                                  setSelectedRoles((current) =>
                                    event.target.checked
                                      ? [...new Set([...current, role])]
                                      : current.filter((item) => item !== role),
                                  )
                                  setError('')
                                }}
                              >
                                {copy.rolesLabel[role]}{assigned ? ` · ${copy.alreadyAssigned}` : ''}
                              </Checkbox>
                            )
                          })}
                        </div>
                      )}
                      <Button
                        type="primary"
                        icon={<CheckOutlined aria-hidden="true" />}
                        onClick={() => void saveAssignment()}
                        loading={saving}
                        disabled={
                          saving ||
                          (isReplacementMode
                            ? replacementAssignments.length === 0
                            : selectedRoles.length === 0)
                        }
                        block
                      >
                        {saving
                          ? copy.saving
                          : isReplacementMode
                            ? copy.replaceSave
                            : copy.save}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {error && <p className="mgr-office-assignment-message is-error" role="alert">{error}</p>}
          {notice && <p className="mgr-office-assignment-message is-success" role="status">{notice}</p>}
          {returnToHref && staffGroups.length > 0 && (
            <Button
              type="primary"
              className="mgr-office-assignment-return"
              icon={<ArrowLeftOutlined aria-hidden="true" />}
              href={returnToHref}
              block
            >
              {copy.returnToMission}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
