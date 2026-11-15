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
  return (
    <table className="odm-adm-table">
      <thead>
        <tr>
          <th>{t.code}</th>
          <th>{t.name}</th>
          <th>{t.window}</th>
          <th className="adm-text-right">{t.actions}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id}>
            <td>
              <div className="adm-cell-mono">{s.code}</div>
              <div className="adm-cell-email">{codes[s.code]}</div>
            </td>
            <td className="adm-wrap adm-strong">{codes[s.code] ?? s.name}</td>
            <td className="adm-cell-mono">
              {s.startTime} – {s.endTime}
            </td>
            <td>
              <RowActions
                label={s.name}
                onEdit={() => onEdit(s)}
                onDelete={() => onDelete(s)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
