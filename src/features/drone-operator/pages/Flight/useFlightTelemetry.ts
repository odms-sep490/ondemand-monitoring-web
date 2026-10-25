import { useMemo } from 'react'
import type { DroneCameraTelemetry } from './components/DroneCameraView'
import { formatTemperature, formatNumber } from './inFlightFormat'
import { inFlightControlMessages } from './components/InFlightControl.messages'
import { useI18n } from '../../../../shared/i18n'
import type { ControlStatus } from './inFlightTypes'

export function useFlightTelemetry({
  controlStatus,
}: {
  controlStatus: ControlStatus | null
}) {
  const { t } = useI18n(inFlightControlMessages)
  const liveBatteryPercent =
    typeof controlStatus?.batteryPercent === 'number' &&
    Number.isFinite(controlStatus.batteryPercent)
      ? controlStatus.batteryPercent
      : typeof controlStatus?.rawPx4BatteryPercent === 'number' &&
          Number.isFinite(controlStatus.rawPx4BatteryPercent)
        ? controlStatus.rawPx4BatteryPercent
        : undefined

  // Camera view reads the SAME GPS telemetry as the main flight map (controlStatus.positionGps).
  const cameraTelemetry = useMemo<DroneCameraTelemetry | null>(() => {
    const gps = controlStatus?.positionGps
    if (!gps) return null
    return {
      latitude: gps.latitude,
      longitude: gps.longitude,
      heading: controlStatus?.yawDeg ?? null,
      altitude: gps.relativeAltitudeM ?? controlStatus?.altitudeM ?? null,
      speedMps: controlStatus?.speedMps ?? null,
      batteryPercent: liveBatteryPercent ?? null,
    }
  }, [
    controlStatus?.positionGps?.latitude,
    controlStatus?.positionGps?.longitude,
    controlStatus?.positionGps?.relativeAltitudeM,
    controlStatus?.yawDeg,
    controlStatus?.altitudeM,
    controlStatus?.speedMps,
    liveBatteryPercent,
  ])

  const telemetryBattery =
    typeof liveBatteryPercent === 'number' &&
    Number.isFinite(liveBatteryPercent)
      ? Math.max(0, Math.min(100, liveBatteryPercent))
      : null
  const batteryDisplay =
    telemetryBattery === null ? '--' : `${telemetryBattery.toFixed(1)}%`
  const batteryState = controlStatus?.batteryState ?? 'NORMAL'
  const showBatteryWarning =
    telemetryBattery !== null && batteryState !== 'NORMAL'
  const thermalMax = formatTemperature(controlStatus?.maxTemperatureC)
  const thermalRows = [
    [
      t.thermalPanel.rows.resolution,
      controlStatus?.thermalFrameWidth && controlStatus?.thermalFrameHeight
        ? `${controlStatus.thermalFrameWidth}x${controlStatus.thermalFrameHeight}`
        : '--',
    ],
    [t.thermalPanel.rows.fps, formatNumber(controlStatus?.thermalFps)],
    [
      t.thermalPanel.rows.mode,
      controlStatus?.thermalMode?.replaceAll('_', ' ') ?? '--',
    ],
    [
      t.thermalPanel.rows.frameAge,
      typeof controlStatus?.thermalFrameAgeMs === 'number'
        ? `${controlStatus.thermalFrameAgeMs} ms`
        : '--',
    ],
    [
      t.thermalPanel.rows.min,
      formatTemperature(controlStatus?.minTemperatureC),
    ],
    [
      t.thermalPanel.rows.avg,
      formatTemperature(controlStatus?.averageTemperatureC),
    ],
    [t.thermalPanel.rows.max, thermalMax],
    [
      t.thermalPanel.rows.threshold,
      formatTemperature(controlStatus?.thermalThresholdC),
    ],
    [t.thermalPanel.rows.palette, controlStatus?.thermalPalette ?? '--'],
    [t.thermalPanel.rows.range, controlStatus?.thermalDisplayRangeMode ?? '--'],
    [
      t.thermalPanel.rows.scale,
      controlStatus?.thermalDisplayMinC != null &&
      controlStatus?.thermalDisplayMaxC != null
        ? `${formatNumber(controlStatus.thermalDisplayMinC)}-${formatNumber(controlStatus.thermalDisplayMaxC)} °C`
        : '--',
    ],
    [
      t.thermalPanel.rows.iso,
      `${controlStatus?.thermalIsothermEnabled ? 'ON' : 'OFF'} / DBG ${controlStatus?.thermalDebugOverlayEnabled ? 'ON' : 'OFF'}`,
    ],
  ]
  return {
    cameraTelemetry,
    telemetryBattery,
    batteryDisplay,
    batteryState,
    showBatteryWarning,
    thermalRows,
  }
}
