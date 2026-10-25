import { useEffect } from 'react'
import { getLanguage, useI18n } from '../../../../shared/i18n'
import { inFlightControlMessages } from './components/InFlightControl.messages'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type { FlightCommand } from './inFlightTypes'
import type { Mission } from '../../types/omss'

export function useCockpitAutomation({
  preflightReady,
  cameraDefaultAppliedRef,
  sendCommand,
  autoStartPlan,
  setLastCommand,
  onAutoStartPlanConsumed,
  mission,
}: {
  preflightReady: boolean
  cameraDefaultAppliedRef: RefObject<boolean>
  sendCommand: (command: FlightCommand) => Promise<void>
  autoStartPlan: boolean
  setLastCommand: Dispatch<SetStateAction<string>>
  onAutoStartPlanConsumed: () => void
  mission: Mission
}) {
  const { t } = useI18n(inFlightControlMessages)
  useEffect(() => {
    if (!preflightReady || cameraDefaultAppliedRef.current) return
    cameraDefaultAppliedRef.current = true
    void sendCommand('camera_front')
  }, [preflightReady, sendCommand])

  useEffect(() => {
    if (!autoStartPlan) return
    if (import.meta.env.VITE_FLIGHT_MAP_ONLY !== 'false') {
      setLastCommand(
        getLanguage() === 'en'
          ? 'Legacy simulation waypoints are unavailable in GPS map mode'
          : 'Đường bay mô phỏng cũ không dùng được trong chế độ bản đồ GPS',
      )
      onAutoStartPlanConsumed()
      return
    }
    if (!preflightReady) return
    if ((mission.routePoints?.length ?? 0) === 0) {
      setLastCommand(t.status.noWaypoints)
      onAutoStartPlanConsumed()
      return
    }
    onAutoStartPlanConsumed()
    void sendCommand('auto_plan_start')
  }, [
    autoStartPlan,
    mission.routePoints,
    onAutoStartPlanConsumed,
    preflightReady,
    sendCommand,
    t,
  ])
}
