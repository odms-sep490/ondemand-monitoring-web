import type { RestrictedZone, GeofenceStatus } from './inFlightTypes'
import { dangerDistanceM, cautionDistanceM } from './inFlightConstants'

export function normalizeRing(
  coordinates: number[][] | undefined,
): [number, number][] {
  if (!coordinates) return []
  const ring = coordinates
    .map((point) => [Number(point[0]), Number(point[1])] as [number, number])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))

  if (ring.length < 3) return []
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)
  return ring
}

export function pointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax)
  if (Math.abs(cross) > 1e-9) return false
  return (px - ax) * (px - bx) + (py - ay) * (py - by) <= 1e-9
}

export function polygonContainsPoint(
  ring: [number, number][],
  point: [number, number],
) {
  const [px, py] = point
  let inside = false
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [ax, ay] = ring[index]
    const [bx, by] = ring[index + 1]
    if (pointOnSegment(px, py, ax, ay, bx, by)) return true
    if (ay > py !== by > py) {
      const xAtY = ax + ((py - ay) * (bx - ax)) / (by - ay)
      if (px < xAtY) inside = !inside
    }
  }
  return inside
}

export function pointSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax
  const dy = by - ay
  const lengthSq = dx * dx + dy * dy
  if (lengthSq <= 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq),
  )
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

export function pointPolygonDistance(
  ring: [number, number][],
  point: [number, number],
) {
  const [px, py] = point
  if (polygonContainsPoint(ring, point)) return 0
  return Math.min(
    ...ring.slice(0, -1).map(([ax, ay], index) => {
      const [bx, by] = ring[index + 1]
      return pointSegmentDistance(px, py, ax, ay, bx, by)
    }),
  )
}

export function evaluateGeofence(
  point: [number, number] | null,
  zones: RestrictedZone[],
): GeofenceStatus {
  if (!point) return { level: 'UNKNOWN' }

  let nearestZone: RestrictedZone | undefined
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const zone of zones) {
    if (polygonContainsPoint(zone.coordinates, point)) {
      return { level: 'VIOLATION', zone, distanceM: 0 }
    }
    const distance = pointPolygonDistance(zone.coordinates, point)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestZone = zone
    }
  }

  if (!nearestZone) return { level: 'SAFE' }
  if (nearestDistance <= dangerDistanceM)
    return { level: 'DANGER', zone: nearestZone, distanceM: nearestDistance }
  if (nearestDistance <= cautionDistanceM)
    return { level: 'CAUTION', zone: nearestZone, distanceM: nearestDistance }
  return { level: 'SAFE', zone: nearestZone, distanceM: nearestDistance }
}
