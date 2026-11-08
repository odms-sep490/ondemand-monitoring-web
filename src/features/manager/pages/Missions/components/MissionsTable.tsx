import { CardComponent, TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionCalendarItem } from '../../../types/missions'
import { missionsPageMessages } from '../MissionsPage.messages'
import { missionsColumns } from './missionsColumns'

export function MissionsTable({
  missions,
  total,
}: {
  missions: MissionCalendarItem[]
  total: number
}) {
  const { t, locale } = useI18n(missionsPageMessages)
  return (
    <CardComponent styles={{ body: { padding: 0 } }}>
      <TableComponent<MissionCalendarItem>
        rowKey="id"
        columns={missionsColumns({ t, locale })}
        dataSource={missions}
      />
      <div className="mgr-table-foot">{t.resultCount(missions.length, total)}</div>
    </CardComponent>
  )
}
