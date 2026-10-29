import { Input, Select } from 'antd'

import { FilterBar, mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { AuditAction } from '../../../types/auditLog'
import { AUDIT_ACTIONS, auditActionMessages } from '../auditActions'
import { auditFiltersMessages } from './AuditFilters.messages'

export type AuditFilterState = {
  action: AuditAction | ''
  entityType: string
  from: string
  to: string
}

export const EMPTY_AUDIT_FILTERS: AuditFilterState = {
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
    <FilterBar
      search={{
        value: value.entityType,
        onChange: (entityType) => onChange({ ...value, entityType }),
        placeholder: t.entityTypePlaceholder,
        ariaLabel: t.entityTypeAria,
      }}
      end={
        <>
          <Select<AuditAction | ''>
            className="adm-filter-select"
            aria-label={t.actionAria}
            value={value.action}
            onChange={(action) => onChange({ ...value, action })}
            getPopupContainer={mgrPopupContainer}
            options={[
              { value: '', label: t.allActions },
              ...AUDIT_ACTIONS.map((a) => ({ value: a, label: actions[a] })),
            ]}
          />
          <Input
            className="adm-filter-date"
            type="date"
            aria-label={t.fromAria}
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
          />
          <Input
            className="adm-filter-date"
            type="date"
            aria-label={t.toAria}
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </>
      }
    />
  )
}
