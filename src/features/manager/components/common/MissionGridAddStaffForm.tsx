import { useMemo, useState } from 'react'
import type { MissionStaffRole } from '../../../mission/types/mission'
import type { AvailableOperator } from '../../../staff/api/operatorApi'
import { missionGridCardMessages } from './MissionGridCard.messages'

type Messages = (typeof missionGridCardMessages)['vi']

export type StaffAssignmentDraft = {
  staffId: string
  roles: MissionStaffRole[]
}

/** Select multiple available people and their roles before submitting once. */
export function MissionGridAddStaffForm({
  t,
  loading,
  busy,
  roles,
  assignedRolesByStaff,
  assignments,
  onAssignmentsChange,
  remainingSlots,
  operators,
  onCancel,
  onSave,
}: {
  t: Messages
  loading: boolean
  busy: boolean
  roles: MissionStaffRole[]
  assignedRolesByStaff: Record<string, MissionStaffRole[]>
  assignments: StaffAssignmentDraft[]
  onAssignmentsChange: (assignments: StaffAssignmentDraft[]) => void
  remainingSlots: number
  operators: AvailableOperator[]
  onCancel: () => void
  onSave: (assignments: StaffAssignmentDraft[]) => void
}) {
  const [search, setSearch] = useState('')
  const selectedByStaff = useMemo(
    () =>
      new Map(
        assignments.map((assignment) => [assignment.staffId, assignment]),
      ),
    [assignments],
  )
  const filteredOperators = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    if (!normalizedSearch) return operators
    return operators.filter(({ fullName, email }) =>
      `${fullName} ${email}`.toLocaleLowerCase().includes(normalizedSearch),
    )
  }, [operators, search])
  const selectedCount = assignments.length
  const selectedRoleCount = assignments.reduce(
    (total, assignment) => total + assignment.roles.length,
    0,
  )
  const selectedNewPeopleCount = assignments.filter(
    ({ staffId }) => !assignedRolesByStaff[staffId]?.length,
  ).length

  function toggleOperator(staffId: string, checked: boolean) {
    if (checked) {
      const assignedRoles = assignedRolesByStaff[staffId] ?? []
      const firstAvailableRole = roles.find(
        (role) => !assignedRoles.includes(role),
      )
      const isAlreadySelected = selectedByStaff.has(staffId)
      const isCurrentlyAssigned = assignedRoles.length > 0
      if (
        isAlreadySelected ||
        !firstAvailableRole ||
        (!isCurrentlyAssigned && selectedNewPeopleCount >= remainingSlots)
      ) {
        return
      }
      onAssignmentsChange([
        ...assignments,
        { staffId, roles: [firstAvailableRole] },
      ])
      return
    }
    onAssignmentsChange(assignments.filter((item) => item.staffId !== staffId))
  }

  function toggleRole(
    staffId: string,
    role: MissionStaffRole,
    checked: boolean,
  ) {
    const selected = selectedByStaff.get(staffId)
    if (!selected || assignedRolesByStaff[staffId]?.includes(role)) return
    const nextRoles = checked
      ? [...new Set([...selected.roles, role])]
      : selected.roles.filter((item) => item !== role)
    onAssignmentsChange(
      nextRoles.length === 0
        ? assignments.filter((item) => item.staffId !== staffId)
        : assignments.map((item) =>
            item.staffId === staffId ? { ...item, roles: nextRoles } : item,
          ),
    )
  }

  return (
    <section
      className="odm-mcard-inline-form odm-mcard-staff-form"
      role="group"
      aria-label={t.addStaffAria}
      aria-busy={loading || busy}
    >
      <div className="odm-mcard-inline-form-heading">
        <strong>{t.addStaffTitle}</strong>
        <span>{t.addStaffHint}</span>
      </div>

      <div className="odm-mcard-staff-toolbar">
        <p className="odm-mcard-inline-form-hint" aria-live="polite">
          {t.staffSelectionCount(
            selectedCount,
            selectedRoleCount,
            remainingSlots,
          )}
        </p>
        {operators.length > 6 && (
          <label className="odm-mcard-staff-search">
            <span className="odm-visually-hidden">{t.staffSearchLabel}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.staffSearchPlaceholder}
              aria-label={t.staffSearchLabel}
              disabled={loading || busy}
            />
          </label>
        )}
      </div>

      {loading ? (
        <p className="odm-mcard-staff-state" role="status">
          {t.staffLoadingHint}
        </p>
      ) : operators.length === 0 ? (
        <p className="odm-mcard-staff-state">{t.staffNoneHint}</p>
      ) : filteredOperators.length === 0 ? (
        <p className="odm-mcard-staff-state">{t.staffSearchEmpty}</p>
      ) : (
        <ul
          className="odm-mcard-staff-options"
          aria-label={t.staffAvailableAria}
        >
          {filteredOperators.map((operator) => {
            const assignment = selectedByStaff.get(operator.id)
            const isSelected = assignment !== undefined
            const assignedRoles = assignedRolesByStaff[operator.id] ?? []
            const hasAllRoles = roles.every((role) =>
              assignedRoles.includes(role),
            )
            const assignableRoles = roles.filter(
              (role) => !assignedRoles.includes(role),
            )
            const allAssignableRolesSelected = assignableRoles.every((role) =>
              assignment?.roles.includes(role),
            )
            const atCapacity =
              selectedNewPeopleCount >= remainingSlots &&
              assignedRoles.length === 0

            return (
              <li
                key={operator.id}
                className={`odm-mcard-staff-option${isSelected ? ' is-selected' : ''}`}
              >
                <label className="odm-mcard-staff-person">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(event) =>
                      toggleOperator(operator.id, event.target.checked)
                    }
                    disabled={
                      busy || hasAllRoles || (atCapacity && !isSelected)
                    }
                  />
                  <span className="odm-mcard-staff-person-copy">
                    <strong>{operator.fullName}</strong>
                    <small>{operator.email}</small>
                  </span>
                </label>
                {isSelected && (
                  <fieldset
                    className="odm-mcard-staff-role-options"
                    aria-label={t.staffRoleFor(operator.fullName)}
                    disabled={busy}
                  >
                    {assignableRoles.length > 0 &&
                      !allAssignableRolesSelected && (
                        <button
                          type="button"
                          className="odm-mcard-staff-all-role-toggle"
                          onClick={() =>
                            onAssignmentsChange(
                              assignments.map((item) =>
                                item.staffId === operator.id
                                  ? {
                                      ...item,
                                      roles: assignableRoles,
                                    }
                                  : item,
                              ),
                            )
                          }
                          disabled={busy}
                        >
                          {assignedRoles.length > 0
                            ? t.staffAssignRemainingRoles
                            : t.staffAssignAllRoles}
                        </button>
                      )}
                    {roles.map((role) => {
                      const isAlreadyAssigned = assignedRoles.includes(role)
                      const isDraftSelected = assignment.roles.includes(role)
                      return (
                        <label
                          key={role}
                          className={`odm-mcard-staff-role-chip${isAlreadyAssigned ? ' is-assigned' : ''}${isDraftSelected ? ' is-selected' : ''}`}
                          title={
                            isAlreadyAssigned
                              ? t.staffRoleAlreadyAssigned
                              : undefined
                          }
                        >
                          <input
                            type="checkbox"
                            checked={isAlreadyAssigned || isDraftSelected}
                            disabled={busy || isAlreadyAssigned}
                            onChange={(event) =>
                              toggleRole(
                                operator.id,
                                role,
                                event.target.checked,
                              )
                            }
                          />
                          <span>{t.staffRoles[role]}</span>
                          {isAlreadyAssigned && (
                            <small>{t.staffRoleAlreadyAssignedShort}</small>
                          )}
                        </label>
                      )
                    })}
                  </fieldset>
                )}
                {hasAllRoles && (
                  <span className="odm-mcard-staff-all-roles">
                    {t.staffAllRolesAssigned}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="odm-mcard-inline-actions">
        <button
          type="button"
          className="odm-btn odm-btn-sm"
          onClick={onCancel}
          disabled={busy}
        >
          {t.cancel}
        </button>
        <button
          type="button"
          className="odm-btn odm-btn-sm odm-btn-p"
          onClick={() => onSave(assignments)}
          disabled={busy || loading || selectedCount === 0}
        >
          {busy
            ? t.staffSaving
            : t.assignStaff(selectedCount, selectedRoleCount)}
        </button>
      </div>
    </section>
  )
}
