import { memo } from 'react'
import type {
  FlightCommand,
  ControlStatus,
  WeatherPreset,
  ControlsText,
  IconName,
} from '../inFlightTypes'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'
import { maySendFlightCommand } from '../../../../mission/lib/missionOperationalState'
import { buttonStyle } from './flightControlStyles'
import { Icon } from './Icon'
import { GlassPanel } from './GlassPanel'
import { FlightControlsHeader } from './FlightControlsHeader'
import { FlightControlGrid } from './FlightControlGrid'
import { FlightControlTools } from './FlightControlTools'

export const FlightControls = memo(function FlightControls({
  canFly,
  canTerminate,
  busyCommand,
  lidarDetailsOpen,
  moreOpen,
  status,
  onCommand,
  onWeatherPreset,
  onToggleMore,
  onReviewMedia,
  onFinishFlight,
  finishFlightBusy,
  onReferenceCapture,
  referenceBusy,
}: {
  canFly: boolean
  canTerminate: boolean
  referenceBusy?: boolean
  onReferenceCapture?: () => void
  onFinishFlight?: () => void
  finishFlightBusy?: boolean
  busyCommand: FlightCommand | null
  lidarDetailsOpen: boolean
  moreOpen: boolean
  status: ControlStatus | null
  onCommand: (command: FlightCommand) => void
  onWeatherPreset: (preset: WeatherPreset) => void
  onToggleMore: () => void
  onReviewMedia?: () => void
}) {
  useRenderDiagnostics('FlightControls')
  const { t } = useI18n(inFlightControlMessages)
  const thermalEnabled = status?.thermalEnabled === true
  const thermalLabel = thermalEnabled
    ? t.toolbar.thermalOn
    : t.toolbar.thermalOff
  const commandDisabled = (command: FlightCommand) =>
    busyCommand !== null || !maySendFlightCommand(command, canFly, canTerminate)
  const controlButton = (item: {
    command: FlightCommand
    labelKey: keyof ControlsText
    icon: IconName
    tone?: 'danger' | 'amber'
  }) => {
    const isThermal = item.command === 'thermal_toggle'
    const isLidar = item.command === 'lidar_monitor_toggle'
    const label = isThermal
      ? thermalEnabled
        ? t.toolbar.thermalOn
        : t.toolbar.thermalOff
      : isLidar
        ? `${t.controls.lidar} ${lidarDetailsOpen ? 'VIEW' : 'UI'}`
        : t.controls[item.labelKey]
    return (
      <button
        key={`${item.command}-${item.labelKey}`}
        onClick={() => onCommand(item.command)}
        disabled={commandDisabled(item.command)}
        style={{
          ...buttonStyle(
            (isThermal && thermalEnabled) || (isLidar && lidarDetailsOpen)
              ? 'amber'
              : item.tone,
          ),
        }}
        title={label}
      >
        <Icon name={item.icon} size={14} />
        <span>{busyCommand === item.command ? t.toolbar.sending : label}</span>
      </button>
    )
  }

  return (
    <GlassPanel
      style={{
        display: 'grid',
        gridTemplateColumns:
          'minmax(220px, .8fr) minmax(340px, 1.25fr) minmax(280px, 1fr)',
        alignItems: 'stretch',
        gap: 8,
        padding: 8,
        width: '100%',
        overflow: 'visible',
      }}
    >
      <FlightControlsHeader
        controlButton={controlButton}
        onCommand={onCommand}
        commandDisabled={commandDisabled}
      />

      <FlightControlGrid
        onCommand={onCommand}
        commandDisabled={commandDisabled}
        busyCommand={busyCommand}
      />

      <FlightControlTools
        onReviewMedia={onReviewMedia}
        busyCommand={busyCommand}
        onReferenceCapture={onReferenceCapture}
        canFly={canFly}
        referenceBusy={referenceBusy}
        onFinishFlight={onFinishFlight}
        commandDisabled={commandDisabled}
        finishFlightBusy={finishFlightBusy}
        onCommand={onCommand}
        thermalEnabled={thermalEnabled}
        thermalLabel={thermalLabel}
        onToggleMore={onToggleMore}
        moreOpen={moreOpen}
        controlButton={controlButton}
        onWeatherPreset={onWeatherPreset}
      />
    </GlassPanel>
  )
})
