import type { CoverageAreaGeometry, GeoPosition } from './types'

const EARTH_RADIUS_M = 6_371_008.8
const DEG_TO_RAD = Math.PI / 180

export type CoverageAreaMetrics = {
  areaM2: number
  perimeterM: number
  vertexCount: number
}

export function closeCoverageRing(points: GeoPosition[]): GeoPosition[] {
  if (points.length === 0) return []
  const first = points[0]
  const last = points.at(-1)
  if (last && samePosition(first, last)) return points
  return [...points, [first[0], first[1]]]
}

export function circleCoverageArea(
  center: GeoPosition,
  radiusM: number,
  pointCount = 64,
): CoverageAreaGeometry {
  const [longitude, latitude] = center
  const angularDistance = radiusM / EARTH_RADIUS_M
  const lat1 = latitude * DEG_TO_RAD
  const lon1 = longitude * DEG_TO_RAD
  const ring: GeoPosition[] = []

  for (let index = 0; index < pointCount; index += 1) {
    // GeoJSON exterior rings should be counterclockwise.
    const bearing = (-2 * Math.PI * index) / pointCount
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
    )
    const lon2 =
      lon1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
      )
    ring.push([lon2 / DEG_TO_RAD, lat2 / DEG_TO_RAD])
  }

  return { type: 'Polygon', coordinates: [closeCoverageRing(ring)] }
}

export function rectangleCoverageArea(
  start: GeoPosition,
  end: GeoPosition,
): CoverageAreaGeometry {
  const west = Math.min(start[0], end[0])
  const east = Math.max(start[0], end[0])
  const south = Math.min(start[1], end[1])
  const north = Math.max(start[1], end[1])
  const ring: GeoPosition[] = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
  ]
  return { type: 'Polygon', coordinates: [closeCoverageRing(ring)] }
}

export function coverageAreaMetrics(
  geometry: CoverageAreaGeometry | null | undefined,
): CoverageAreaMetrics | null {
  const ring = geometry?.coordinates[0]
  if (!ring || ring.length < 3) return null
  const closed = samePosition(ring[0], ring.at(-1)!)
  const positions = closed ? ring : closeCoverageRing(ring)
  let signedArea = 0
  let perimeterM = 0

  for (let index = 0; index < positions.length - 1; index += 1) {
    const [lon1, lat1] = positions[index]
    const [lon2, lat2] = positions[index + 1]
    const lonDelta = (lon2 - lon1) * DEG_TO_RAD
    const lat1Rad = lat1 * DEG_TO_RAD
    const lat2Rad = lat2 * DEG_TO_RAD
    signedArea += lonDelta * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad))
    perimeterM += haversineDistance(positions[index], positions[index + 1])
  }

  return {
    areaM2: Math.abs((signedArea * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2),
    perimeterM,
    vertexCount: Math.max(0, positions.length - 1),
  }
}

export function isValidCoverageArea(
  geometry: CoverageAreaGeometry | null | undefined,
): boolean {
  const ring = geometry?.coordinates[0]
  if (!ring || ring.length < 4 || !samePosition(ring[0], ring.at(-1)!)) {
    return false
  }

  const vertices = ring.slice(0, -1)
  if (vertices.length < 3 || new Set(vertices.map(positionKey)).size < 3) {
    return false
  }
  const metrics = coverageAreaMetrics(geometry)
  if (!metrics || metrics.areaM2 < 1) return false

  const centerLatitude =
    vertices.reduce((sum, position) => sum + position[1], 0) / vertices.length
  const projected = vertices.map(
    ([longitude, latitude]) =>
      [
        longitude *
          DEG_TO_RAD *
          EARTH_RADIUS_M *
          Math.cos(centerLatitude * DEG_TO_RAD),
        latitude * DEG_TO_RAD * EARTH_RADIUS_M,
      ] as const,
  )

  for (let first = 0; first < projected.length; first += 1) {
    const firstNext = (first + 1) % projected.length
    for (let second = first + 1; second < projected.length; second += 1) {
      const secondNext = (second + 1) % projected.length
      if (first === second || firstNext === second || secondNext === first)
        continue
      if (
        segmentsIntersect(
          projected[first],
          projected[firstNext],
          projected[second],
          projected[secondNext],
        )
      ) {
        return false
      }
    }
  }

  return true
}

export function formatAreaM2(areaM2: number): string {
  if (areaM2 >= 10_000) return `${(areaM2 / 10_000).toFixed(2)} ha`
  return `${Math.round(areaM2).toLocaleString()} m²`
}

export function formatLengthM(lengthM: number): string {
  return lengthM >= 1_000
    ? `${(lengthM / 1_000).toFixed(2)} km`
    : `${Math.round(lengthM).toLocaleString()} m`
}

function haversineDistance(first: GeoPosition, second: GeoPosition): number {
  const lat1 = first[1] * DEG_TO_RAD
  const lat2 = second[1] * DEG_TO_RAD
  const dLat = lat2 - lat1
  const dLon = (second[0] - first[0]) * DEG_TO_RAD
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function samePosition(first: GeoPosition, second: GeoPosition): boolean {
  return (
    Math.abs(first[0] - second[0]) < 1e-9 &&
    Math.abs(first[1] - second[1]) < 1e-9
  )
}

function positionKey(position: GeoPosition): string {
  return `${position[0].toFixed(8)},${position[1].toFixed(8)}`
}

function segmentsIntersect(
  a: readonly [number, number],
  b: readonly [number, number],
  c: readonly [number, number],
  d: readonly [number, number],
): boolean {
  const orientation = (
    p: readonly [number, number],
    q: readonly [number, number],
    r: readonly [number, number],
  ) => (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1])
  const onSegment = (
    p: readonly [number, number],
    q: readonly [number, number],
    r: readonly [number, number],
  ) =>
    q[0] <= Math.max(p[0], r[0]) + 1e-7 &&
    q[0] >= Math.min(p[0], r[0]) - 1e-7 &&
    q[1] <= Math.max(p[1], r[1]) + 1e-7 &&
    q[1] >= Math.min(p[1], r[1]) - 1e-7

  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)
  if (o1 * o2 < 0 && o3 * o4 < 0) return true
  if (Math.abs(o1) < 1e-7 && onSegment(a, c, b)) return true
  if (Math.abs(o2) < 1e-7 && onSegment(a, d, b)) return true
  if (Math.abs(o3) < 1e-7 && onSegment(c, a, d)) return true
  if (Math.abs(o4) < 1e-7 && onSegment(c, b, d)) return true
  return false
}
