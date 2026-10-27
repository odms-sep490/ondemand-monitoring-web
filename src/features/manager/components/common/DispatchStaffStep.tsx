import { CloseOutlined } from '@ant-design/icons'
import { StaffRoleIcon } from './StaffRoleIcon'
import type { Mission } from '../../../mission/types/mission'
import { OrderIcon } from './OrderIcon'
import { missionRoles } from './liveDispatchConstants'
import { StaffCombobox } from './StaffCombobox'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { commonMiscMessages } from './commonMisc.messages'
import { useI18n } from '../../../../shared/i18n'
import type { MissionStaffRole } from '../../../mission/types/mission'
import type { Dispatch, SetStateAction } from 'react'
import type { AvailableOperator } from '../../../staff/api/operatorApi'

export function DispatchStaffStep({
  missingRoles,
  current,
  scheduleText,
  staffByRole,
  setStaffByRole,
  setError,
  operators,
  openStaffRole,
  setOpenStaffRole,
  selectedStaffIds,
}: {
  missingRoles: number
  current: Mission
  scheduleText: string
  staffByRole: Partial<Record<MissionStaffRole, string[]>>
  setStaffByRole: Dispatch<
    SetStateAction<Partial<Record<MissionStaffRole, string[]>>>
  >
  setError: Dispatch<SetStateAction<string | null>>
  operators: { data: AvailableOperator[] | undefined; reload: () => void }
  openStaffRole: MissionStaffRole | null
  setOpenStaffRole: Dispatch<SetStateAction<MissionStaffRole | null>>
  selectedStaffIds: string[]
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  const { t: m } = useI18n(commonMiscMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="users" size={18} />
          {t.step1}
        </span>
        <span
          className={`odm-or-pill ${missingRoles === 0 ? 'odm-or-pill-green' : 'odm-or-pill-amber'}`}
        >
          {missingRoles === 0 ? t.rolesComplete : t.rolesMissing(missingRoles)}
        </span>
      </header>
      <div className="odm-or-card-body mgr-stack">
        {current && (
          <p className="odm-assign-mission">
            <strong>{current.missionCode}</strong>
            <span>{scheduleText}</span>
          </p>
        )}
        <p className="odm-or-muted mgr-flush">
          {t.roleHelp} {t.staffAvailabilityHint}
        </p>
        <div className="odm-or-role-grid">
          {missionRoles.map((role) => {
            const selected = staffByRole[role] ?? []
            return (
              <section
                key={role}
                className={`odm-or-role-card${selected.length > 0 ? ' is-filled' : ''}`}
              >
                <span className="odm-or-role-head">
                  <span>
                    <StaffRoleIcon role={role} /> {t.roles[role]}
                  </span>
                  {selected.length > 0 && (
                    <span className="odm-or-role-check">
                      <OrderIcon name="check" size={16} />
                    </span>
                  )}
                </span>
                <span className="odm-or-muted mgr-small">
                  {t.roleDescriptions[role]}
                </span>
                {selected.length > 0 &&
                  missionRoles.some(
                    (other) => (staffByRole[other] ?? []).length === 0,
                  ) && (
                    <button
                      type="button"
                      className="odm-or-link-btn odm-or-bulk-assign"
                      onClick={() => {
                        setStaffByRole(
                          Object.fromEntries(
                            missionRoles.map((other) => [
                              other,
                              (staffByRole[other] ?? []).length > 0
                                ? staffByRole[other]
                                : [selected[0]],
                            ]),
                          ) as typeof staffByRole,
                        )
                        setError(null)
                      }}
                    >
                      {m.useForEmptyRoles}
                    </button>
                  )}
                <StaffCombobox
                  role={role}
                  staff={operators.data ?? []}
                  selectedIds={selected}
                  staffByRole={staffByRole}
                  open={openStaffRole === role}
                  t={t}
                  onOpen={() => setOpenStaffRole(role)}
                  onClose={() => setOpenStaffRole(null)}
                  onToggle={(staffId) => {
                    setStaffByRole((cur) => {
                      const currentIds = cur[role] ?? []
                      const nextRoleStaff = currentIds.includes(staffId)
                        ? currentIds.filter((id) => id !== staffId)
                        : [...currentIds, staffId]
                      return { ...cur, [role]: nextRoleStaff }
                    })
                    setError(null)
                  }}
                  onRemove={(staffId) => {
                    setStaffByRole((cur) => ({
                      ...cur,
                      [role]: (cur[role] ?? []).filter((id) => id !== staffId),
                    }))
                    setError(null)
                  }}
                />
              </section>
            )
          })}
        </div>
        {!operators.data?.length && (
          <p className="odm-or-empty">{t.noAvailableOperators}</p>
        )}
        {selectedStaffIds.length > 0 && (
          <div className="odm-or-chips">
            <strong>{t.selectedStaff}</strong>
            {missionRoles.flatMap((role) =>
              (staffByRole[role] ?? []).map((selectedId) => {
                const staff = (operators.data ?? []).find(
                  (item) => item.id === selectedId,
                )
                if (!staff) return null
                return (
                  <span key={`${role}-${selectedId}`} className="odm-or-chip">
                    <b>{t.roles[role]}</b>
                    {staff.fullName}
                    <button
                      type="button"
                      className="odm-or-chip-x"
                      onClick={() =>
                        setStaffByRole((cur) => ({
                          ...cur,
                          [role]: (cur[role] ?? []).filter(
                            (id) => id !== selectedId,
                          ),
                        }))
                      }
                      aria-label={`${t.clearStaff} ${staff.fullName}`}
                    >
                      <CloseOutlined aria-hidden="true" />
                    </button>
                  </span>
                )
              }),
            )}
            <button
              type="button"
              className="odm-or-link-btn"
              onClick={() => setStaffByRole({})}
            >
              {t.clearAll}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
