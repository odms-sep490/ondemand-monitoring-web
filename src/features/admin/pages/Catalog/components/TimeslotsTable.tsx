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
        <span className="mgr-cell-stack">
          <span className="mgr-code">{s.code}</span>
          <span className="mgr-cell-sub">{codes[s.code]}</span>
        </span>
      ),
    },
    {
      title: t.name,
      key: 'name',
      render: (_, s) => <strong className="adm-wrap">{s.name}</strong>,
    },
    {
      title: t.window,
      key: 'window',
      render: (_, s) => (
        <span className="mgr-nowrap">
          {s.startTime} – {s.endTime}
        </span>
      ),
    },
    {
      title: t.actions,
      key: 'actions',
      align: 'right',
      render: (_, s) => (
        <RowActions label={s.name} onEdit={() => onEdit(s)} onDelete={() => onDelete(s)} />
      ),
    },
  ]
  return <TableComponent<AdminTimeslot> rowKey="id" columns={columns} dataSource={items} />
}
