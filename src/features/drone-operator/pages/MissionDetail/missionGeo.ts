import { HCMC_SERVICE_CENTER } from '../../../../shared/lib/serviceArea'
import type { OperatorMission } from '../../types/mission'
import L from 'leaflet'

// ─── Map card ─────────────────────────────────────────────────────────────────

export function validGps(
  point: { latitude: number; longitude: number } | null,
) {
  return (
    point !== null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180 &&
    (point.latitude !== 0 || point.longitude !== 0)
  )
}

export function legacySimulationToGps(simX: number, simY: number) {
  const latitude = HCMC_SERVICE_CENTER.latitude + simY / 111_320
  const longitude =
    HCMC_SERVICE_CENTER.longitude +
    simX / (111_320 * Math.cos((HCMC_SERVICE_CENTER.latitude * Math.PI) / 180))
  return {
    latitude: Number(latitude.toFixed(7)),
    longitude: Number(longitude.toFixed(7)),
  }
}

export function missionTargetGps(mission: OperatorMission) {
  const direct = {
    latitude: mission.latitude ?? Number.NaN,
    longitude: mission.longitude ?? Number.NaN,
  }
  if (validGps(direct)) return direct

  const fromTarget = {
    latitude: mission.targetY ?? Number.NaN,
    longitude: mission.targetX ?? Number.NaN,
  }
  if (validGps(fromTarget)) return fromTarget

  if (
    typeof mission.targetX === 'number' &&
    typeof mission.targetY === 'number'
  ) {
    return legacySimulationToGps(mission.targetX, mission.targetY)
  }

  return null
}

export function routeMarkerIcon(label: string, color: string) {
  return L.divIcon({
    html: `<div style="
      min-width:42px;
      height:24px;
      padding:0 8px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      box-sizing:border-box;
      background:${color};
      color:#fff;
      border:2px solid #fff;
      box-shadow:0 3px 10px rgba(15,23,42,.28);
      font-size:10px;
      font-weight:800;
      line-height:1;
    ">${label}</div>`,
    className: 'mds-route-marker',
    iconSize: [42, 24],
    iconAnchor: [21, 12],
  })
}
