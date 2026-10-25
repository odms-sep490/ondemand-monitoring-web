import type {
  ControlStatus,
  LidarDirection,
  LidarSeverity,
} from './inFlightTypes'
import { dangerDistanceM, cautionDistanceM } from './inFlightConstants'

export function getLidarFresh(lidar: ControlStatus['lidar']) {
  return (
    typeof lidar?.scanAgeS === 'number' &&
    Number.isFinite(lidar.scanAgeS) &&
    lidar.scanAgeS < 3
  )
}

export function getLidarMetric(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(1)} m`
    : '--'
}

export const lidarSectorPaths: Record<LidarDirection, string> = {
  FRONT: 'M0 0 L-44 -66 A79 79 0 0 1 44 -66 Z',
  RIGHT: 'M0 0 L66 -44 A79 79 0 0 1 66 44 Z',
  BACK: 'M0 0 L44 66 A79 79 0 0 1 -44 66 Z',
  LEFT: 'M0 0 L-66 44 A79 79 0 0 1 -66 -44 Z',
}

export const lidarSectorLabels: Record<
  LidarDirection,
  { x: number; y: number; anchor: 'start' | 'middle' | 'end' }
> = {
  FRONT: { x: 0, y: -92, anchor: 'middle' },
  LEFT: { x: -95, y: -4, anchor: 'end' },
  RIGHT: { x: 95, y: -4, anchor: 'start' },
  BACK: { x: 0, y: 92, anchor: 'middle' },
}

export function getValidLidarDistance(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null
}

export function getMinValidDistance(values: Array<number | null | undefined>) {
  const valid = values
    .map(getValidLidarDistance)
    .filter((value): value is number => value !== null)
  return valid.length > 0 ? Math.min(...valid) : null
}

export function getLidarSeverity(
  distance: number | null,
  fresh: boolean,
  maxRange: number,
): LidarSeverity {
  if (!fresh || distance === null) return 'UNKNOWN'
  if (distance >= maxRange * 0.995) return 'CLEAR'
  if (distance <= dangerDistanceM) return 'DANGER'
  if (distance <= cautionDistanceM) return 'CAUTION'
  return 'CLEAR'
}

export function formatLidarDistance(distance: number | null, maxRange: number) {
  if (distance === null) return '--'
  if (distance >= maxRange * 0.995) return `> ${Math.round(maxRange)} m`
  return `${distance.toFixed(1)} m`
}

export function getLidarSeverityStyle(severity: LidarSeverity) {
  if (severity === 'DANGER') {
    return {
      fill: 'rgba(239,68,68,.34)',
      stroke: '#ef4444',
      text: '#fecaca',
      badgeBg: 'rgba(239,68,68,.22)',
      badgeBorder: 'rgba(248,113,113,.42)',
      icon: '#f87171',
    }
  }
  if (severity === 'CAUTION') {
    return {
      fill: 'rgba(245,158,11,.28)',
      stroke: '#f59e0b',
      text: '#fde68a',
      badgeBg: 'rgba(245,158,11,.2)',
      badgeBorder: 'rgba(251,191,36,.42)',
      icon: '#fbbf24',
    }
  }
  if (severity === 'CLEAR') {
    return {
      fill: 'rgba(34,197,94,.25)',
      stroke: '#22c55e',
      text: '#bbf7d0',
      badgeBg: 'rgba(34,197,94,.18)',
      badgeBorder: 'rgba(74,222,128,.32)',
      icon: '#22c55e',
    }
  }
  return {
    fill: 'rgba(148,163,184,.18)',
    stroke: '#94a3b8',
    text: '#cbd5e1',
    badgeBg: 'rgba(148,163,184,.14)',
    badgeBorder: 'rgba(148,163,184,.26)',
    icon: '#94a3b8',
  }
}
