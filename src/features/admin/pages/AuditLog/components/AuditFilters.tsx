import { useI18n } from '../../../../../shared/i18n'
import type { AuditAction } from '../../../types/auditLog'
import { AUDIT_ACTIONS, auditActionMessages } from '../auditActions'
import { auditFiltersMessages } from './AuditFilters.messages'

export type AuditFilterState = {
  actorQuery: string
  action: AuditAction | ''
  entityType: string
  from: string
  to: string
}

export const EMPTY_AUDIT_FILTERS: AuditFilterState = {
  actorQuery: '',
  action: '',
  entityType: '',
  from: '',
  to: '',
}

type Props = {
  value: AuditFilterState
  onChange: (next: AuditFilterState) => void
}

export function AuditFilters({ value, onChange }: Props) {
  const { t } = useI18n(auditFiltersMessages)
  const { t: actions } = useI18n(auditActionMessages)
  return (
    <div className="odm-adm-account-filters">
      <input
        className="odm-inp odm-adm-account-select"
        aria-label={t.actorAria}
        placeholder={t.actorPlaceholder}
        value={value.actorQuery}
        onChange={(e) => onChange({ ...value, actorQuery: e.target.value })}
      />
      <select
        className="odm-inp odm-adm-account-select"
        aria-label={t.actionAria}
        value={value.action}
        onChange={(e) =>
          onChange({ ...value, action: e.target.value as AuditAction | '' })
        }
      >
        <option value="">{t.allActions}</option>
        {AUDIT_ACTIONS.map((a) => (
          <option key={a} value={a}>
            {actions[a]}
          </option>
        ))}
      </select>
      <input
        className="odm-inp odm-adm-account-select"
        aria-label={t.entityTypeAria}
        placeholder={t.entityTypePlaceholder}
        value={value.entityType}
        onChange={(e) => onChange({ ...value, entityType: e.target.value })}
      />
      <input
        className="odm-inp odm-adm-account-select"
        type="date"
        aria-label={t.fromAria}
        value={value.from}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
      />
      <input
        className="odm-inp odm-adm-account-select"
        type="date"
        aria-label={t.toAria}
        value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
      />
    </div>
  )
}
