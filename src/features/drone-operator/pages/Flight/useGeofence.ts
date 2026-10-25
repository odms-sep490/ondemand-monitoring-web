import { statusToSimulationPoint } from './planHelpers'
import { useMemo } from 'react'
import { evaluateGeofence } from './geofence'
import { inFlightControlMessages } from './components/InFlightControl.messages'
import { useI18n } from '../../../../shared/i18n'
import type { ControlStatus, RestrictedZone } from './inFlightTypes'

export function useGeofence({
  controlStatus,
  restrictedZones,
}: {
  controlStatus: ControlStatus | null
  restrictedZones: RestrictedZone[]
}) {
  const { t } = useI18n(inFlightControlMessages)
  const dronePoint = statusToSimulationPoint(controlStatus)
  const geofenceStatus = useMemo(
    () => evaluateGeofence(dronePoint, restrictedZones),
    [dronePoint, restrictedZones],
  )
  const geofenceAlertActive =
    geofenceStatus.level === 'CAUTION' ||
    geofenceStatus.level === 'DANGER' ||
    geofenceStatus.level === 'VIOLATION'
  const geofenceTone =
    geofenceStatus.level === 'VIOLATION' || geofenceStatus.level === 'DANGER'
      ? 'danger'
      : 'amber'
  const geofenceZoneName =
    geofenceStatus.zone?.name ??
    geofenceStatus.zone?.code ??
    t.geofence.restrictedZoneFallback
  const geofenceMessage =
    geofenceStatus.level === 'VIOLATION'
      ? t.geofence.breach(geofenceZoneName)
      : geofenceStatus.level === 'DANGER'
        ? t.geofence.danger(
            Math.round(geofenceStatus.distanceM ?? 0),
            geofenceZoneName,
          )
        : geofenceStatus.level === 'CAUTION'
          ? t.geofence.caution(
              Math.round(geofenceStatus.distanceM ?? 0),
              geofenceZoneName,
            )
          : t.geofence.allNominal
  const footerStatusColor = geofenceAlertActive
    ? geofenceTone === 'danger'
      ? '#fecaca'
      : '#fde68a'
    : '#bbf7d0'
  const footerStatusDot = geofenceAlertActive
    ? geofenceTone === 'danger'
      ? '#ef4444'
      : '#f59e0b'
    : '#22c55e'
  return {
    geofenceStatus,
    geofenceAlertActive,
    geofenceTone,
    geofenceMessage,
    footerStatusColor,
    footerStatusDot,
  }
}
