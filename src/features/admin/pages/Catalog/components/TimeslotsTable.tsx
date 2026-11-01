import type { ColumnsType } from 'antd/es/table'

import { TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { AdminTimeslot } from '../../../types/catalog'
import { RowActions } from './RowActions'
import { timeslotCodeMessages } from './timeslotCodes'
import { timeslotsTableMessages } from './TimeslotsTable.messages'

export function TimeslotsTable({
  items,
  onEdit,
  onDelete,
}: {
  items: AdminTimeslot[]
  onEdit: (s: AdminTimeslot) => void
  onDelete: (s: AdminTimeslot) => void
}) {
  const { t } = useI18n(timeslotsTableMessages)
  const { t: codes } = useI18n(timeslotCodeMessages)

  const columns: ColumnsType<AdminTimeslot> = [
    {
      title: t.code,
      key: 'code',
      render: (_, s) => (
        <div className="mgr-cell-stack">
          <span className="adm-mono adm-strong">{s.code}</span>
          <span className="mgr-cell-sub">{codes[s.code]}</span>
        </div>
      ),
    },
    {
      title: t.name,
      key: 'name',
      render: (_, s) => <span className="adm-wrap adm-strong">{s.name}</span>,
    },
    {
      title: t.window,
      key: 'window',
      className: 'mgr-nowrap',
      render: (_, s) => (
        <span className="adm-mono">
          {s.startTime} – {s.endTime}
        </span>
      ),
    },
    {
      title: t.actions,
      key: 'actions',
      align: 'right',
      render: (_, s) => (
        <RowActions
          label={s.name}
          onEdit={() => onEdit(s)}
          onDelete={() => onDelete(s)}
        />
      ),
    },
  ]

  return (
    <TableComponent<AdminTimeslot>
      rowKey="id"
      className="adm-wide-table"
      columns={columns}
      dataSource={items}
    />
  )
}
