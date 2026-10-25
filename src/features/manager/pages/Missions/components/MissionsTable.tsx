import type { MissionCalendarItem } from '../../../types/missions'
import type { Dispatch, SetStateAction } from 'react'
import type { DeliveryStatus } from '../missionsTypes'
import { MissionRow } from './MissionRow'

export function MissionsTable({
  columns,
  missions,
  selectedMission,
  setSelectedMission,
  deliveryStatuses,
  orderDeliveryStatuses,
}: {
  columns: string[]
  missions: MissionCalendarItem[]
  selectedMission: string | null
  setSelectedMission: Dispatch<SetStateAction<string | null>>
  deliveryStatuses: Record<string, DeliveryStatus>
  orderDeliveryStatuses: Record<string, DeliveryStatus>
}) {
  return (
    <section className="odm-or-card odm-or-table-card">
      <div className="odm-or-table-scroll">
        <table className="odm-or-table">
          <thead>
            <tr>
              {columns.map((label, index) => (
                <th key={index}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {missions.map((m) => (
              <MissionRow
                key={m.id}
                selectedMission={selectedMission}
                m={m}
                setSelectedMission={setSelectedMission}
                deliveryStatuses={deliveryStatuses}
                orderDeliveryStatuses={orderDeliveryStatuses}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
