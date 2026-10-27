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
  role,
  onRoleChange,
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
  role: MissionStaffRole
  onRoleChange: (role: MissionStaffRole) => void
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
      <div className="odm-mcard-inline-fields">
        <label className="odm-mcard-field">
          <span>{t.roleLabel}</span>
          <select
            aria-label={t.staffRoleAria}
            value={role}
            onChange={(e) => onRoleChange(e.target.value as MissionStaffRole)}
            className="odm-input odm-input-sm odm-mcard-grow-1"
          >
            {roles.map((r) => (
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
            value={staffId}
            onChange={(e) => onStaffChange(e.target.value)}
            className="odm-input odm-input-sm odm-mcard-grow-2"
            disabled={loading || busy || operators.length === 0}
          >
            {loading ? (
              <option>{t.staffLoadingOption}</option>
            ) : operators.length === 0 ? (
              <option>{t.staffNoneOption}</option>
            ) : (
              operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.fullName}
                </option>
              ))
            )}
          </select>
        </label>
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
          onClick={onSave}
          disabled={busy || loading || !staffId}
        >
          {t.save}
        </button>
      </div>
    </div>
  )
}
