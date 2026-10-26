import type { Dispatch, SetStateAction } from 'react'

import { CardComponent, TableComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionCalendarItem } from '../../../types/missions'
import { missionsPageMessages } from '../MissionsPage.messages'
import type { DeliveryStatus } from '../missionsTypes'
import { missionsColumns } from './missionsColumns'

export function MissionsTable({
  missions,
  total,
  selectedMission,
  setSelectedMission,
  deliveryStatuses,
  orderDeliveryStatuses,
}: {
  missions: MissionCalendarItem[]
  total: number
  selectedMission: string | null
  setSelectedMission: Dispatch<SetStateAction<string | null>>
  deliveryStatuses: Record<string, DeliveryStatus>
  orderDeliveryStatuses: Record<string, DeliveryStatus>
}) {
  const { t, locale } = useI18n(missionsPageMessages)
  return (
    <CardComponent styles={{ body: { padding: 0 } }}>
      <TableComponent<MissionCalendarItem>
        rowKey="id"
        columns={missionsColumns({ t, locale, deliveryStatuses, orderDeliveryStatuses })}
        dataSource={missions}
        rowClassName={(m) => `mgr-row-click${selectedMission === m.id ? ' is-selected' : ''}`}
        onRow={(m) => ({
          onClick: () => setSelectedMission(selectedMission === m.id ? null : m.id),
        })}
      />
      <div className="mgr-table-foot">{t.resultCount(missions.length, total)}</div>
    </CardComponent>
  )
}
