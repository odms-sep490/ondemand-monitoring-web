import { useEffect } from 'react'
import { missionRoles } from './liveDispatchConstants'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { AvailableDrone } from '../../../staff/api/droneApi'
import type { AvailableOperator } from '../../../staff/api/operatorApi'
import type { MissionStaffRole } from '../../../mission/types/mission'
import type { Dispatch, SetStateAction, RefObject } from 'react'
import type { DispatchStep } from './liveDispatchTypes'

export function useDispatchStaffSync({
  resourcesReady,
  availability,
  droneIds,
  staffByRole,
  setDroneIds,
  setStaffByRole,
  conflictStep,
  setActiveStep,
  setOpenStaffRole,
  setDevicePickerOpen,
  setError,
}: {
  resourcesReady: boolean
  availability: UseApiQueryState<{
    scope: string
    devices: AvailableDrone[]
    people: AvailableOperator[]
  } | null>
  droneIds: string[]
  staffByRole: Partial<Record<MissionStaffRole, string[]>>
  setDroneIds: Dispatch<SetStateAction<string[]>>
  setStaffByRole: Dispatch<
    SetStateAction<Partial<Record<MissionStaffRole, string[]>>>
  >
  conflictStep: RefObject<'staff' | 'device' | null>
  setActiveStep: Dispatch<SetStateAction<DispatchStep>>
  setOpenStaffRole: Dispatch<SetStateAction<MissionStaffRole | null>>
  setDevicePickerOpen: Dispatch<SetStateAction<boolean>>
  setError: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  useEffect(() => {
    if (!resourcesReady) return
    const deviceSet = new Set(availability.data?.devices.map((item) => item.id))
    const staffSet = new Set(availability.data?.people.map((item) => item.id))
    const deviceInvalid = droneIds.some((id) => !deviceSet.has(id))
    const staffInvalid = missionRoles.some((role) =>
      (staffByRole[role] ?? []).some((id) => !staffSet.has(id)),
    )
    if (deviceInvalid)
      setDroneIds((ids) => ids.filter((id) => deviceSet.has(id)))
    if (staffInvalid)
      setStaffByRole((crew) =>
        Object.fromEntries(
          missionRoles.map((role) => [
            role,
            (crew[role] ?? []).filter((id) => staffSet.has(id)),
          ]),
        ),
      )
    if (deviceInvalid || staffInvalid || conflictStep.current) {
      const step =
        conflictStep.current === 'device'
          ? 'device'
          : staffInvalid
            ? 'staff'
            : deviceInvalid
              ? 'device'
              : conflictStep.current!
      setActiveStep(step)
      setOpenStaffRole(null)
      setDevicePickerOpen(false)
      setError(
        deviceInvalid || staffInvalid
          ? step === 'staff'
            ? t.staffAvailabilityChanged
            : t.deviceAvailabilityChanged
          : t.resourceAvailabilityChanged,
      )
      conflictStep.current = null
    }
  }, [
    resourcesReady,
    availability.data,
    droneIds,
    staffByRole,
    t.staffAvailabilityChanged,
    t.deviceAvailabilityChanged,
    t.resourceAvailabilityChanged,
  ])
}
