import { OrderIcon } from './OrderIcon'
import { DeviceCombobox } from './DeviceCombobox'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { AvailableDrone } from '../../../staff/api/droneApi'
import type { Dispatch, SetStateAction } from 'react'
import type { MissionStaffRole } from '../../../mission/types/mission'

export function DispatchDeviceStep({
  selectedDrones,
  drones,
  droneIds,
  devicePickerOpen,
  setDevicePickerOpen,
  setOpenStaffRole,
  setDroneIds,
  setError,
}: {
  selectedDrones: AvailableDrone[]
  drones: { data: AvailableDrone[] | undefined; reload: () => void }
  droneIds: string[]
  devicePickerOpen: boolean
  setDevicePickerOpen: Dispatch<SetStateAction<boolean>>
  setOpenStaffRole: Dispatch<SetStateAction<MissionStaffRole | null>>
  setDroneIds: Dispatch<SetStateAction<string[]>>
  setError: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="drone" size={18} />
          {t.step2}
        </span>
        {selectedDrones.length > 0 && (
          <span className="odm-or-pill odm-or-pill-blue">
            {t.deviceSelectedCount(selectedDrones.length)}
          </span>
        )}
      </header>
      <div className="odm-or-card-body mgr-stack">
        <p className="odm-or-muted mgr-flush">
          {t.deviceHelp} {t.deviceAvailabilityHint}
        </p>
        {!drones.data?.length ? (
          <p className="odm-or-empty">{t.noAvailableDrones}</p>
        ) : (
          <section className="odm-or-device-box">
            <div className="odm-or-role-head mgr-spaced">
              <span>
                <b>{t.selectedDevice}</b>
                {selectedDrones.length > 0 ? (
                  <span className="odm-or-muted mgr-block-note">
                    {t.deviceSelectedCount(selectedDrones.length)}
                  </span>
                ) : null}
              </span>
              {selectedDrones.length > 0 && (
                <span className="odm-or-role-check">
                  <OrderIcon name="check" size={16} />
                </span>
              )}
            </div>
            <DeviceCombobox
              devices={drones.data ?? []}
              selectedIds={droneIds}
              open={devicePickerOpen}
              t={t}
              onOpen={() => {
                setDevicePickerOpen(true)
                setOpenStaffRole(null)
              }}
              onClose={() => setDevicePickerOpen(false)}
              onToggle={(deviceId) => {
                setDroneIds((currentIds) =>
                  currentIds.includes(deviceId)
                    ? currentIds.filter((id) => id !== deviceId)
                    : [...currentIds, deviceId],
                )
                setError(null)
              }}
              onRemove={(deviceId) => {
                setDroneIds((currentIds) =>
                  currentIds.filter((id) => id !== deviceId),
                )
                setError(null)
              }}
              onClear={() => {
                setDroneIds([])
                setError(null)
              }}
            />
          </section>
        )}
      </div>
    </section>
  )
}
