import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  droneStatusTone,
  getDroneStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { dronesPageMessages } from '../DronesPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { DroneResponse } from '../../../types/drones'
import type { Dispatch, SetStateAction } from 'react'

export function DroneRow({
  drone,
  canChange,
  setChangingDrone,
}: {
  drone: DroneResponse
  canChange: boolean
  setChangingDrone: Dispatch<SetStateAction<DroneResponse | null>>
}) {
  const { t, lang } = useI18n(dronesPageMessages)
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '8px 12px', fontWeight: 500 }}>
        {drone.serialNumber}
        {drone.droneModel?.modelCode ? (
          <span
            style={{
              fontWeight: 400,
              color: 'var(--tx2)',
              marginLeft: 4,
            }}
          >
            {drone.droneModel.modelCode}
          </span>
        ) : null}
      </td>
      <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
        {drone.droneModel?.modelCode ?? '—'}
      </td>
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge tone={droneStatusTone[drone.status]}>
          {getDroneStatusLabel(drone.status, lang)}
        </StatusBadge>
      </td>
      <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>—</td>
      <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>—</td>
      <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
        {drone.dronePayload?.modelName ?? '—'}
      </td>
      <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>—</td>
      <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
        {drone.updatedAt ?? '—'}
      </td>
      <td style={{ padding: '8px 12px' }}>
        {canChange && (
          <button
            type="button"
            className="odm-btn"
            style={{ fontSize: 12 }}
            onClick={() => setChangingDrone(drone)}
          >
            {t.changeStatus}
          </button>
        )}
      </td>
    </tr>
  )
}
