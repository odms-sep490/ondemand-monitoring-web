import { useEffect, useMemo, useState } from 'react'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { Button } from '../../../shared/components/Button'
import { useI18n } from '../../../shared/i18n'
import { missionApi } from '../../mission/api/missionApi'
import type { Mission } from '../../mission/types/mission'
import { droneApi, type AvailableDrone } from '../api/droneApi'
import { operatorApi, type AvailableOperator } from '../api/operatorApi'
import { staffAssignmentPageMessages } from './StaffAssignmentPage.messages'
import type { MissionStaffRole } from '../../mission/types/mission'
import { SingleAssignmentSelect } from '../components/SingleAssignmentSelect'

const missionRoles: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]

type StaffPickerTarget = {
  missionId: string
  role: MissionStaffRole
} | null

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function StaffAssignmentPage() {
  const { t } = useI18n(staffAssignmentPageMessages)
  const [missions, setMissions] = useState<Mission[]>([])
  const [drones, setDrones] = useState<AvailableDrone[]>([])
  const [operators, setOperators] = useState<AvailableOperator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigningMissionId, setAssigningMissionId] = useState<string | null>(
    null,
  )

  const [selectedDrone, setSelectedDrone] = useState<Record<string, string>>({})
  const [selectedStaffByRole, setSelectedStaffByRole] = useState<
    Record<string, Partial<Record<MissionStaffRole, string>>>
  >({})
  const [staffPicker, setStaffPicker] = useState<StaffPickerTarget>(null)
  const [staffSearch, setStaffSearch] = useState('')
  const [availableOnly, setAvailableOnly] = useState(true)

  const fetchAssignments = async () => {
    setLoading(true)
    setError(null)
    try {
      const [missionData, availableDrones, availableOperators] =
        await Promise.all([
          missionApi.getPendingAssignmentMissions(),
          droneApi.getAvailable(),
          operatorApi.getAvailable(),
        ])
      setMissions(missionData || [])
      setDrones(availableDrones)
      setOperators(availableOperators)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const handleAssign = async (missionId: string) => {
    const droneId = selectedDrone[missionId]
    const staffAssignments = selectedStaffByRole[missionId] ?? {}

    if (!droneId || !staffAssignments.PILOT) {
      setError(t.chooseAll)
      return
    }
    setAssigningMissionId(missionId)
    setError(null)
    try {
      await missionApi.assignResources(missionId, droneId, staffAssignments)
      await fetchAssignments()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.assignFailed)
    } finally {
      setAssigningMissionId(null)
    }
  }

  const openStaffPicker = (missionId: string, role: MissionStaffRole) => {
    setStaffPicker({ missionId, role })
    setStaffSearch('')
    setAvailableOnly(true)
  }

  const selectStaff = (
    missionId: string,
    role: MissionStaffRole,
    staffId: string,
  ) => {
    setSelectedStaffByRole({
      ...selectedStaffByRole,
      [missionId]: {
        ...(selectedStaffByRole[missionId] ?? {}),
        [role]: staffId,
      },
    })
    setStaffPicker(null)
  }

  const clearStaff = (missionId: string, role: MissionStaffRole) => {
    const nextMission = { ...(selectedStaffByRole[missionId] ?? {}) }
    delete nextMission[role]
    setSelectedStaffByRole({
      ...selectedStaffByRole,
      [missionId]: nextMission,
    })
  }

  const pickerStaff = useMemo(() => {
    const query = staffSearch.trim().toLowerCase()
    return operators.filter((operator) => {
      if (!query) return true
      return `${operator.fullName} ${operator.email}`
        .toLowerCase()
        .includes(query)
    })
  }, [operators, staffSearch])

  const staffById = useMemo(
    () => new Map(operators.map((operator) => [operator.id, operator])),
    [operators],
  )

  return (
    <PortalLayout role="MANAGER" title={t.title} subtitle={t.subtitle}>
      <section className="portal-panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2>{t.pendingAssignments}</h2>
          <Button onClick={fetchAssignments}>{t.refresh}</Button>
        </div>

        {error && (
          <p role="alert" style={{ color: 'var(--red-text)' }}>
            {error}
          </p>
        )}
        {loading ? (
          <p>{t.loadingMissions}</p>
        ) : missions.length === 0 ? (
          <p>{t.noMissions}</p>
        ) : (
          <div style={{ display: 'grid', gap: 18 }}>
            {missions.map((m) => {
              const staffAssignments = selectedStaffByRole[m.id] ?? {}
              const assignedCount = missionRoles.filter(
                (role) => staffAssignments[role],
              ).length
              const missing = missionRoles
                .filter((role) => role === 'PILOT')
                .filter((role) => !staffAssignments[role])
                .map((role) => t.roles[role])
              return (
                <article
                  key={m.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'var(--surface)',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'minmax(220px, 1.2fr) minmax(220px, 0.8fr)',
                      gap: 18,
                      padding: 18,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: 'var(--text-3)',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {t.missionId}
                      </div>
                      <h3 style={{ margin: '4px 0 6px' }}>
                        {m.orderTitle ?? m.id}
                      </h3>
                      <div style={{ color: 'var(--text-3)', fontSize: 13 }}>
                        {m.id} · {m.customerName}
                      </div>
                    </div>
                    <SingleAssignmentSelect
                      label={t.selectDrone}
                      value={selectedDrone[m.id] || ''}
                      onChange={(value) =>
                        setSelectedDrone({
                          ...selectedDrone,
                          [m.id]: value,
                        })
                      }
                      placeholder={t.chooseDronePlaceholder}
                      options={drones}
                    />
                  </div>

                  <div style={{ padding: 18 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        alignItems: 'flex-start',
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0 }}>{t.staffSectionTitle}</h4>
                        <p
                          style={{ margin: '4px 0 0', color: 'var(--text-3)' }}
                        >
                          {t.staffSectionSubtitle}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 13 }}>
                        <strong>
                          {t.assignedCount(assignedCount, missionRoles.length)}
                        </strong>
                        <div
                          style={{
                            color: missing.length
                              ? 'var(--red-text)'
                              : 'var(--green-text)',
                          }}
                        >
                          {missing.length
                            ? t.missingRoles(missing.join(', '))
                            : t.noMissingRoles}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(210px, 1fr))',
                        gap: 12,
                      }}
                    >
                      {missionRoles.map((role) => {
                        const staff = staffAssignments[role]
                          ? staffById.get(staffAssignments[role] as string)
                          : undefined
                        return (
                          <div
                            key={role}
                            style={{
                              border: staff
                                ? '1px solid rgba(22, 163, 74, 0.42)'
                                : '1px solid var(--border)',
                              borderRadius: 10,
                              padding: 14,
                              background: staff
                                ? 'rgba(22, 163, 74, 0.06)'
                                : 'var(--bg)',
                              minHeight: 190,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 12,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  gap: 8,
                                }}
                              >
                                <strong>{t.roles[role]}</strong>
                                {staff && (
                                  <span
                                    style={{
                                      color: 'var(--green-text)',
                                      fontSize: 12,
                                    }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </div>
                              <div
                                style={{ color: 'var(--text-3)', fontSize: 12 }}
                              >
                                {t.roleDescriptions[role]}
                              </div>
                            </div>

                            {staff ? (
                              <div style={{ display: 'grid', gap: 8 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 10,
                                    alignItems: 'center',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 34,
                                      height: 34,
                                      borderRadius: '50%',
                                      background: '#dbeafe',
                                      color: '#1d4ed8',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: 12,
                                      flex: '0 0 auto',
                                    }}
                                  >
                                    {initials(staff.fullName)}
                                  </span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 700 }}>
                                      {staff.fullName}
                                    </div>
                                    <div
                                      style={{
                                        color: 'var(--text-3)',
                                        fontSize: 12,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {staff.email}
                                    </div>
                                  </div>
                                </div>
                                <span
                                  style={{
                                    color: 'var(--green-text)',
                                    fontSize: 12,
                                  }}
                                >
                                  ● {t.available}
                                </span>
                              </div>
                            ) : (
                              <div
                                style={{ color: 'var(--text-3)', fontSize: 13 }}
                              >
                                {t.unassigned}
                              </div>
                            )}

                            <div
                              style={{
                                marginTop: 'auto',
                                display: 'flex',
                                gap: 8,
                              }}
                            >
                              <button
                                type="button"
                                className="odm-btn odm-btn-sm"
                                onClick={() => openStaffPicker(m.id, role)}
                              >
                                {staff ? t.changeStaff : t.chooseStaff}
                              </button>
                              {staff && (
                                <button
                                  type="button"
                                  className="odm-btn odm-btn-gh odm-btn-sm"
                                  aria-label={`${t.removeStaff} ${t.roles[role]}`}
                                  onClick={() => clearStaff(m.id, role)}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{ color: 'var(--text-3)', fontSize: 13 }}>
                        {t.assignedCount(assignedCount, missionRoles.length)}
                      </div>
                      <Button
                        disabled={assigningMissionId !== null}
                        onClick={() => void handleAssign(m.id)}
                      >
                        {assigningMissionId === m.id ? t.assigning : t.assign}
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {staffPicker && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.42)',
            zIndex: 50,
            display: 'grid',
            placeItems: 'center',
            padding: 24,
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setStaffPicker(null)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={t.pickerTitle(t.roles[staffPicker.role])}
            style={{
              width: 'min(620px, 100%)',
              maxHeight: 'min(720px, 90vh)',
              background: 'var(--surface)',
              borderRadius: 14,
              boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <header
              style={{
                padding: 18,
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  {t.pickerTitle(t.roles[staffPicker.role])}
                </h3>
                <div style={{ color: 'var(--text-3)', fontSize: 13 }}>
                  {t.roleDescriptions[staffPicker.role]}
                </div>
              </div>
              <button
                type="button"
                className="odm-btn odm-btn-gh odm-btn-sm"
                onClick={() => setStaffPicker(null)}
              >
                {t.close}
              </button>
            </header>

            <div style={{ padding: 18, display: 'grid', gap: 12 }}>
              <input
                value={staffSearch}
                onChange={(event) => setStaffSearch(event.target.value)}
                placeholder={t.staffSearchPlaceholder}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  font: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={
                    availableOnly
                      ? 'odm-btn odm-btn-p odm-btn-sm'
                      : 'odm-btn odm-btn-sm'
                  }
                  onClick={() => setAvailableOnly(true)}
                >
                  ✓ {t.onlyAvailable}
                </button>
                <button
                  type="button"
                  className={
                    !availableOnly
                      ? 'odm-btn odm-btn-p odm-btn-sm'
                      : 'odm-btn odm-btn-sm'
                  }
                  onClick={() => setAvailableOnly(false)}
                >
                  {t.showAll}
                </button>
              </div>
            </div>

            <div
              style={{
                overflowY: 'auto',
                padding: '0 18px 18px',
                display: 'grid',
                gap: 10,
              }}
            >
              {pickerStaff.length === 0 ? (
                <div
                  style={{
                    padding: 24,
                    border: '1px dashed var(--border)',
                    borderRadius: 10,
                    color: 'var(--text-3)',
                    textAlign: 'center',
                  }}
                >
                  {t.noStaffFound}
                </div>
              ) : (
                pickerStaff.map((staff) => {
                  const assignedRoles = missionRoles.filter(
                    (role) =>
                      selectedStaffByRole[staffPicker.missionId]?.[role] ===
                      staff.id,
                  )
                  return (
                    <article
                      key={staff.id}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: 14,
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
                        <span
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            flex: '0 0 auto',
                          }}
                        >
                          {initials(staff.fullName)}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800 }}>
                            {staff.fullName}
                          </div>
                          <div style={{ color: 'var(--text-3)', fontSize: 13 }}>
                            {staff.email}
                          </div>
                          <div
                            style={{
                              color: 'var(--green-text)',
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
                            ● {t.available}
                          </div>
                          {assignedRoles.length > 0 && (
                            <div
                              style={{
                                marginTop: 8,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 6,
                              }}
                            >
                              <span
                                style={{ color: 'var(--text-3)', fontSize: 12 }}
                              >
                                {t.alreadyAssigned}:
                              </span>
                              {assignedRoles.map((role) => (
                                <span
                                  key={role}
                                  style={{
                                    padding: '2px 7px',
                                    borderRadius: 999,
                                    background: '#e0f2fe',
                                    color: '#0369a1',
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  {t.roles[role]}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="odm-btn odm-btn-p odm-btn-sm"
                        onClick={() =>
                          selectStaff(
                            staffPicker.missionId,
                            staffPicker.role,
                            staff.id,
                          )
                        }
                      >
                        {assignedRoles.length
                          ? t.addRole(t.roles[staffPicker.role])
                          : t.selectThisStaff}
                      </button>
                    </article>
                  )
                })
              )}
            </div>
          </section>
        </div>
      )}
    </PortalLayout>
  )
}
