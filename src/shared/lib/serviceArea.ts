export type GpsPoint = {
  latitude: number
  longitude: number
}

export const HCMC_SERVICE_CENTER: GpsPoint = {
  latitude: Number(import.meta.env.VITE_HCMC_HOME_LAT ?? 10.7769),
  longitude: Number(import.meta.env.VITE_HCMC_HOME_LON ?? 106.7009),
}

export const HCMC_SERVICE_POLYGON: GpsPoint[] = [
  { latitude: 10.3700, longitude: 106.3600 },
  { latitude: 10.5200, longitude: 106.2000 },
  { latitude: 10.8800, longitude: 106.2700 },
  { latitude: 11.1700, longitude: 106.5000 },
  { latitude: 11.1600, longitude: 106.9000 },
  { latitude: 10.9700, longitude: 107.1500 },
  { latitude: 10.5900, longitude: 107.1000 },
  { latitude: 10.3400, longitude: 106.9000 },
]

export function isValidGps(point: GpsPoint) {
  return Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
}

export function isPointInPolygon(point: GpsPoint, polygon: GpsPoint[]) {
  if (!isValidGps(point) || polygon.length < 3) return false

  const x = point.longitude
  const y = point.latitude
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].longitude
    const yi = polygon[i].latitude
    const xj = polygon[j].longitude
    const yj = polygon[j].latitude
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }

  return inside
}

export function isInsideHcmcServiceArea(point: GpsPoint) {
  return isPointInPolygon(point, HCMC_SERVICE_POLYGON)
}

export function isLocationInsideCoverageArea(point: GpsPoint, area: { coordinates: number[][][] } | null) {
  const ring = area?.coordinates[0]
  if (!isValidGps(point) || !ring || ring.length < 4) return false
  const polygon = ring.map(([longitude, latitude]) => ({ longitude, latitude }))
  if (isPointInPolygon(point, polygon)) return true
  return polygon.some((a, index) => {
    const b = polygon[(index + 1) % polygon.length]
    const cross = (point.longitude - a.longitude) * (b.latitude - a.latitude) -
      (point.latitude - a.latitude) * (b.longitude - a.longitude)
    return Math.abs(cross) < 1e-12 &&
      point.longitude >= Math.min(a.longitude, b.longitude) && point.longitude <= Math.max(a.longitude, b.longitude) &&
      point.latitude >= Math.min(a.latitude, b.latitude) && point.latitude <= Math.max(a.latitude, b.latitude)
  })
}

export function hcmcServicePolygonLatLngs() {
  return HCMC_SERVICE_POLYGON.map((point) => [point.latitude, point.longitude] as [number, number])
}

/** Checks the whole drawn boundary, including edges crossing a concave service boundary. */
export function isCoverageInsideHcmcServiceArea(area: { coordinates: number[][][] } | null) {
  const ring = area?.coordinates[0]
  if (!ring || ring.length < 4) return false
  const boundary = HCMC_SERVICE_POLYGON
  const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx
  const covered = (x: number, y: number) => {
    if (isInsideHcmcServiceArea({ longitude: x, latitude: y })) return true
    return boundary.some((a, i) => {
      const b = boundary[(i + 1) % boundary.length]
      return Math.abs(cross(x - a.longitude, y - a.latitude, b.longitude - a.longitude, b.latitude - a.latitude)) < 1e-10 &&
        x >= Math.min(a.longitude, b.longitude) - 1e-10 && x <= Math.max(a.longitude, b.longitude) + 1e-10 &&
        y >= Math.min(a.latitude, b.latitude) - 1e-10 && y <= Math.max(a.latitude, b.latitude) + 1e-10
    })
  }
  return ring.every((a, index) => {
    const b = ring[(index + 1) % ring.length]
    if (!covered(a[0], a[1])) return false
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const cuts = [0, 1]
    boundary.forEach((c, i) => {
      const d = boundary[(i + 1) % boundary.length]
      const ex = d.longitude - c.longitude, ey = d.latitude - c.latitude
      const denominator = cross(dx, dy, ex, ey)
      if (Math.abs(denominator) < 1e-12) return
      const qx = c.longitude - a[0], qy = c.latitude - a[1]
      const t = cross(qx, qy, ex, ey) / denominator
      const u = cross(qx, qy, dx, dy) / denominator
      if (t > 0 && t < 1 && u >= 0 && u <= 1) cuts.push(t)
    })
    cuts.sort((x, y) => x - y)
    return cuts.slice(1).every((end, i) => {
      const t = (cuts[i] + end) / 2
      return covered(a[0] + dx * t, a[1] + dy * t)
    })
  })
}
