import { CameraFeed } from './CameraFeed'
import { Icon } from './Icon'
import { CameraStatusPanel } from './CameraStatusPanel'
import { ThermalPanel } from './ThermalPanel'
import { BatteryWarningBanner } from './BatteryWarningBanner'
import { CommandStatusBadge } from './CommandStatusBadge'
import { GeofenceBanner } from './GeofenceBanner'
import type { ControlStatus, GeofenceStatus } from '../inFlightTypes'

export function MissionControlCamera({
  streamUrl,
  preflightReady,
  isOnline,
  handleOnline,
  handleOffline,
  controlStatus,
  thermalEnabled,
  thermalRows,
  showBatteryWarning,
  geofenceAlertActive,
  batteryState,
  batteryDisplay,
  operationalMessage,
  lastCommand,
  geofenceTone,
  geofenceStatus,
  geofenceMessage,
}: {
  streamUrl: string
  preflightReady: boolean
  isOnline: boolean
  handleOnline: () => void
  handleOffline: () => void
  controlStatus: ControlStatus | null
  thermalEnabled: boolean
  thermalRows: string[][]
  showBatteryWarning: boolean
  geofenceAlertActive: boolean
  batteryState: 'NORMAL' | 'LOW' | 'CRITICAL' | 'EMERGENCY'
  batteryDisplay: string
  operationalMessage: string | undefined
  lastCommand: string
  geofenceTone: string
  geofenceStatus: GeofenceStatus
  geofenceMessage: string
}) {
  return (
    <section
      className="mission-control-primary"
      style={{
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        display: 'grid',
      }}
    >
      <div
        className="mission-control-camera-card"
        style={{
          position: 'relative',
          minWidth: 0,
          minHeight: 350,
          height: '100%',
          overflow: 'hidden',
          borderRadius: 10,
          border:
            '1px solid color-mix(in srgb, var(--fc-blue) 32%, transparent)',
          background: 'var(--fc-bg)',
          boxShadow: '0 18px 45px color-mix(in srgb, black 24%, transparent)',
        }}
      >
        <CameraFeed
          streamUrl={streamUrl}
          preflightReady={preflightReady}
          isOnline={isOnline}
          onOnline={handleOnline}
          onOffline={handleOffline}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at center, transparent 0 42%, color-mix(in srgb, var(--fc-bg) 8%, transparent) 72%, color-mix(in srgb, var(--fc-bg) 34%, transparent) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 78,
            height: 78,
            transform: 'translate(-50%,-50%)',
            color: 'color-mix(in srgb, var(--fc-tx) 68%, transparent)',
            pointerEvents: 'none',
          }}
        >
          <Icon name="crosshair" size={78} />
        </div>

        <CameraStatusPanel status={controlStatus} />

        {thermalEnabled && (
          <ThermalPanel
            controlStatus={controlStatus}
            thermalRows={thermalRows}
          />
        )}

        {showBatteryWarning && (
          <BatteryWarningBanner
            geofenceAlertActive={geofenceAlertActive}
            batteryState={batteryState}
            batteryDisplay={batteryDisplay}
          />
        )}

        <CommandStatusBadge
          operationalMessage={operationalMessage}
          lastCommand={lastCommand}
        />

        {geofenceAlertActive && (
          <GeofenceBanner
            geofenceTone={geofenceTone}
            geofenceStatus={geofenceStatus}
            geofenceMessage={geofenceMessage}
          />
        )}
      </div>
    </section>
  )
}
