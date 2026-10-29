import { useI18n } from '../../../../../shared/i18n'
import { DroneChip } from '../../../components/common/DroneChip'
import { FlightStepHeader } from '../../../components/common/FlightStepper'
import { NO_DRONE_SENTINEL } from '../preflightConstants'
import { preflightPageMessages } from '../PreflightPage.messages'

export function PreflightHeader({
  missionLabel,
  missionId,
  isAlreadyInFlight,
  deviceId,
  deviceLabel,
}: {
  missionLabel: string | undefined
  missionId: string
  isAlreadyInFlight: boolean
  deviceId: string
  deviceLabel: string | undefined
}) {
  const { t } = useI18n(preflightPageMessages)
  return (
    <FlightStepHeader
      title={t.stepTitle}
      missionId={missionLabel ?? missionId}
      active={isAlreadyInFlight ? 5 : 3}
      right={
        <DroneChip
          label={
            deviceId === NO_DRONE_SENTINEL
              ? t.noDroneAssigned
              : (deviceLabel ?? deviceId)
          }
        />
      }
    />
  )
}
