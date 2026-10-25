import { FlightStepHeader } from '../../../components/common/FlightStepper'
import { NO_DRONE_SENTINEL } from '../preflightConstants'
import { preflightPageMessages } from '../PreflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'

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
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 32,
            padding: '0 12px',
            borderRadius: 16,
            background: 'var(--sf3)',
            fontWeight: 700,
            fontSize: 13,
            flex: 'none',
            maxWidth: 150,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {deviceId === NO_DRONE_SENTINEL
            ? t.noDroneAssigned
            : (deviceLabel ?? deviceId)}
        </span>
      }
    />
  )
}
