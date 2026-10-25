import { MANUAL_TRANSITIONS } from '../droneHelpers'
import { dronesPageMessages } from '../DronesPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { DroneResponse } from '../../../types/drones'
import type { Dispatch, SetStateAction } from 'react'
import { DroneRow } from './DroneRow'

export function DronesTable({
  visible,
  setChangingDrone,
}: {
  visible: DroneResponse[]
  setChangingDrone: Dispatch<SetStateAction<DroneResponse | null>>
}) {
  const { t } = useI18n(dronesPageMessages)
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--border)',
              color: 'var(--tx3)',
              textAlign: 'left',
            }}
          >
            <th style={{ padding: '8px 12px', fontWeight: 500 }}>
              {t.columns.drone}
            </th>
            <th style={{ padding: '8px 12px', fontWeight: 500 }}>
              {t.columns.model}
            </th>
            <th style={{ padding: '8px 12px', fontWeight: 500 }}>
              {t.columns.status}
            </th>
            <th style={{ padding: '8px 12px', fontWeight: 500 }}>
              {t.columns.battery}
            </th>
            <th style={{ padding: '8px 12px', fontWeight: 500 }}>
              {t.columns.station}
            </th>
            <th style={{ padding: '8px 12px', fontWeight: 500 }}>
              {t.columns.payload}
            </th>
            <th style={{ padding: '8px 12px', fontWeight: 500 }}>
              {t.columns.flightHours}
            </th>
            <th style={{ padding: '8px 12px', fontWeight: 500 }}>
              {t.columns.lastActivity}
            </th>
            <th style={{ padding: '8px 12px', fontWeight: 500 }} />
          </tr>
        </thead>
        <tbody>
          {visible.map((drone) => {
            const canChange =
              (MANUAL_TRANSITIONS[drone.status]?.length ?? 0) > 0
            return (
              <DroneRow
                key={drone.id}
                drone={drone}
                canChange={canChange}
                setChangingDrone={setChangingDrone}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
