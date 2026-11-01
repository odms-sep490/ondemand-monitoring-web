import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { Button, Tag } from 'antd'

import { useI18n } from '../../../../shared/i18n'
import type { ServiceChecklist } from '../../api/checklistsApi'
import { PricingChips } from './PricingChips'
import { ChecklistIconButton } from './ChecklistUi'
import { checklistMessages } from './checklists.messages'

/** Ordered default checklists of one service with reorder / configure / remove actions. */
export function ServiceChecklistList({
  rows,
  busy,
  onConfigure,
  onMove,
  onRemove,
}: {
  rows: ServiceChecklist[]
  busy: boolean
  onConfigure: (row: ServiceChecklist) => void
  onMove: (index: number, offset: number) => void
  onRemove: (row: ServiceChecklist) => void
}) {
  const { t } = useI18n(checklistMessages)
  return (
    <ol className="checklist-list">
      {rows.map((row, index) => (
        <li key={row.id} className="checklist-row">
          <span className="checklist-order" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="checklist-row-content">
            <div>{row.content}</div>
            <div className="checklist-chips">
              {!row.checklistActive && <Tag bordered={false}>{t.inactive}</Tag>}
              {row.required && (
                <Tag bordered={false} color="warning">
                  {t.requiredBadge}
                </Tag>
              )}
              {(row.usedByServiceCount ?? 0) > 1 && (
                <Tag bordered={false} color="processing">
                  {t.sharedBadge(row.usedByServiceCount ?? 0)}
                </Tag>
              )}
            </div>
            <PricingChips row={row} />
          </div>
          <div className="checklist-actions">
            <Button disabled={busy} onClick={() => onConfigure(row)}>
              {t.configure}
            </Button>
            <ChecklistIconButton
              icon={
                <ArrowUpOutlined aria-hidden="true" aria-label={undefined} />
              }
              label={t.up + ': ' + row.content}
              disabled={busy || index === 0}
              onClick={() => onMove(index, -1)}
            />
            <ChecklistIconButton
              icon={
                <ArrowDownOutlined aria-hidden="true" aria-label={undefined} />
              }
              label={t.down + ': ' + row.content}
              disabled={busy || index === rows.length - 1}
              onClick={() => onMove(index, 1)}
            />
            <Button
              danger
              type="text"
              icon={
                <DeleteOutlined aria-hidden="true" aria-label={undefined} />
              }
              aria-label={t.remove + ': ' + row.content}
              title={t.remove}
              disabled={busy}
              onClick={() => onRemove(row)}
            >
              {t.remove}
            </Button>
          </div>
        </li>
      ))}
    </ol>
  )
}
