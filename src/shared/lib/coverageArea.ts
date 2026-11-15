import type { GeoJsonPolygon } from '../types/geo'

export type CoverageAreaLatLng = [latitude: number, longitude: number]

const EARTH_RADIUS_M = 6_371_008.8
const DEG_TO_RAD = Math.PI / 180

function polygonCoordinates(value: unknown): number[][][] | null {
  if (!value || typeof value !== 'object') return null
  const geometry = value as Partial<GeoJsonPolygon>
  if (geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) {
    return null
  }

  const rings = geometry.coordinates
    .map((ring) => {
      if (!Array.isArray(ring)) return []
      return ring.filter(
        (position): position is number[] =>
          Array.isArray(position) &&
          position.length >= 2 &&
          typeof position[0] === 'number' &&
          Number.isFinite(position[0]) &&
          Math.abs(position[0]) <= 180 &&
          typeof position[1] === 'number' &&
          Number.isFinite(position[1]) &&
          Math.abs(position[1]) <= 90,
      )
    })
    .filter((ring) => ring.length >= 3)

  return rings.length > 0 ? rings : null
}

/** Converts GeoJSON [longitude, latitude] rings into Leaflet [latitude, longitude]. */
export function coverageAreaToLatLngRings(
  value: unknown,
): CoverageAreaLatLng[][] | null {
  const rings = polygonCoordinates(value)
  return (
    rings?.map((ring) =>
      ring.map(([longitude, latitude]) => [latitude, longitude]),
    ) ?? null
  )
}

/** Calculates an approximate spherical area, subtracting any polygon holes. */
export function coverageAreaSquareMeters(value: unknown): number | null {
  const rings = polygonCoordinates(value)
  if (!rings) return null

  const area = rings.reduce((total, ring, index) => {
    let sum = 0
    for (let pointIndex = 0; pointIndex < ring.length; pointIndex += 1) {
      const [longitude1, latitude1] = ring[pointIndex]
      const [longitude2, latitude2] = ring[(pointIndex + 1) % ring.length]
      sum +=
        (longitude2 - longitude1) *
        DEG_TO_RAD *
        (2 +
          Math.sin(latitude1 * DEG_TO_RAD) +
          Math.sin(latitude2 * DEG_TO_RAD))
    }
    const ringArea = Math.abs((sum * EARTH_RADIUS_M ** 2) / 2)
    return total + (index === 0 ? ringArea : -ringArea)
  }, 0)

  return area > 0 ? area : null
}
