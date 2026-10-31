import { Button, Checkbox, Select } from 'antd'
import type { MissionStaffRole } from '../../../mission/types/mission'
import type { AvailableOperator } from '../../../staff/api/operatorApi'
import { STAFF_ROLE_LABELS } from './missionDetailHelpers'
import { missionGridCardMessages } from './MissionGridCard.messages'

type Messages = (typeof missionGridCardMessages)['vi']

/** Inline "add staff" form of a mission card (presentation only; state lives in the card). */
export function MissionGridAddStaffForm({
  t,
  loading,
  busy,
  roles,
  selectedRoles,
  onRolesChange,
  staffId,
  onStaffChange,
  operators,
  onCancel,
  onSave,
}: {
  t: Messages
  loading: boolean
  busy: boolean
  roles: MissionStaffRole[]
  selectedRoles: MissionStaffRole[]
  onRolesChange: (roles: MissionStaffRole[]) => void
  staffId: string
  onStaffChange: (id: string) => void
  operators: AvailableOperator[]
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div
      className="odm-mcard-inline-form"
      role="group"
      aria-label={t.addStaffAria}
      aria-busy={loading || busy}
    >
      <div className="odm-mcard-inline-form-heading">
        <strong>{t.addStaffTitle}</strong>
        <span>{t.addStaffHint}</span>
      </div>
      <div className="odm-mcard-add-staff-fields">
        <label className="odm-mcard-field">
          <span>{t.staffLabel}</span>
          <Select
            showSearch
            optionFilterProp="label"
            aria-label={t.staffAvailableAria}
            value={staffId}
            onChange={onStaffChange}
            className="odm-mcard-staff-select"
            disabled={loading || busy || operators.length === 0}
            loading={loading}
            placeholder={loading ? t.staffLoadingOption : t.staffNoneOption}
            options={operators.map((operator) => ({
              value: operator.id,
              label: `${operator.fullName} (${operator.email})`,
            }))}
          />
        </label>
        <div className="odm-mcard-field">
          <span>{t.roleLabel}</span>
          <Checkbox.Group
            aria-label={t.staffRoleAria}
            className="odm-mcard-role-chips"
            value={selectedRoles}
            onChange={(values) => onRolesChange(values as MissionStaffRole[])}
            disabled={busy}
          >
            {roles.map((role) => (
              <Checkbox
                key={role}
                value={role}
                className={`odm-mcard-role-chip${selectedRoles.includes(role) ? ' is-selected' : ''}`}
              >
                {STAFF_ROLE_LABELS[role] || role}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>
      </div>
      <p
        className="odm-mcard-inline-form-hint"
        role={loading ? 'status' : undefined}
      >
        {loading
          ? t.staffLoadingHint
          : operators.length > 0
            ? t.staffCountHint(operators.length)
            : t.staffNoneHint}
      </p>
      <div className="odm-mcard-inline-actions">
        <Button
          size="small"
          onClick={onCancel}
          disabled={busy}
        >
          {t.cancel}
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={onSave}
          loading={busy}
          disabled={loading || !staffId || selectedRoles.length === 0}
        >
          {t.save}
        </Button>
      </div>
    </div>
  )
}
