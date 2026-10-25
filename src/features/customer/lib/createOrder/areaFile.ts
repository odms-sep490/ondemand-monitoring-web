export type ParsedArea = {
  latitude: number
  longitude: number
  /** Radius that covers every coordinate, clamped to the slider range. */
  radiusM: number
  /** Total length of LineString paths, when the file has any. */
  lengthM?: number
}

export const AREA_RADIUS_MIN = 100
export const AREA_RADIUS_MAX = 1500

type Coord = [number, number] // [lon, lat]

function distanceM(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLon / 2) ** 2
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)))
}

function isCoord(value: unknown): value is Coord {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    Math.abs(value[1] as number) <= 90 &&
    Math.abs(value[0] as number) <= 180
  )
}

type Collected = { all: Coord[]; lines: Coord[][] }

function collectGeometry(geometry: unknown, out: Collected) {
  if (!geometry || typeof geometry !== 'object') return
  const g = geometry as { type?: string; coordinates?: unknown; geometries?: unknown[] }
  const walk = (value: unknown) => {
    if (isCoord(value)) out.all.push([value[0], value[1]])
    else if (Array.isArray(value)) value.forEach(walk)
  }
  if (g.type === 'GeometryCollection') {
    g.geometries?.forEach((item) => collectGeometry(item, out))
    return
  }
  walk(g.coordinates)
  if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
    out.lines.push((g.coordinates as unknown[]).filter(isCoord).map((c) => [c[0], c[1]]))
  }
  if (g.type === 'MultiLineString' && Array.isArray(g.coordinates)) {
    for (const line of g.coordinates as unknown[][]) {
      out.lines.push(line.filter(isCoord).map((c) => [c[0], c[1]]))
    }
  }
}

function collectGeoJson(text: string): Collected | null {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return null
  }
  const out: Collected = { all: [], lines: [] }
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { type?: string; features?: unknown[]; geometry?: unknown }
    if (n.type === 'FeatureCollection') n.features?.forEach(visit)
    else if (n.type === 'Feature') collectGeometry(n.geometry, out)
    else collectGeometry(n, out)
  }
  visit(json)
  return out
}

function parseKmlCoords(block: string): Coord[] {
  return block
    .trim()
    .split(/\s+/)
    .map((tuple) => tuple.split(',').map(Number))
    .filter(isCoord)
    .map((c) => [c[0], c[1]] as Coord)
}

function collectKml(text: string): Collected | null {
  if (!/<kml[\s>]/i.test(text)) return null
  const out: Collected = { all: [], lines: [] }
  for (const match of text.matchAll(/<coordinates[^>]*>([\s\S]*?)<\/coordinates>/gi)) {
    out.all.push(...parseKmlCoords(match[1]))
  }
  for (const match of text.matchAll(
    /<LineString[^>]*>[\s\S]*?<coordinates[^>]*>([\s\S]*?)<\/coordinates>/gi,
  )) {
    out.lines.push(parseKmlCoords(match[1]))
  }
  return out
}

function pathLengthM(path: Coord[]) {
  let total = 0
  for (let i = 1; i < path.length; i += 1) {
    total += distanceM(
      { latitude: path[i - 1][1], longitude: path[i - 1][0] },
      { latitude: path[i][1], longitude: path[i][0] },
    )
  }
  return total
}

/** Reads a GeoJSON or KML file and derives a centre, covering radius and path length. */
export function parseAreaFile(fileName: string, text: string): ParsedArea | null {
  const lower = fileName.toLowerCase()
  let collected: Collected | null = null
  if (lower.endsWith('.kml')) collected = collectKml(text)
  else if (lower.endsWith('.geojson') || lower.endsWith('.json')) collected = collectGeoJson(text)
  if (!collected || collected.all.length === 0) return null

  const lons = collected.all.map((c) => c[0])
  const lats = collected.all.map((c) => c[1])
  const center = {
    longitude: (Math.min(...lons) + Math.max(...lons)) / 2,
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
  }
  const farthest = Math.max(
    ...collected.all.map((c) => distanceM(center, { latitude: c[1], longitude: c[0] })),
  )
  const radiusM = Math.min(
    AREA_RADIUS_MAX,
    Math.max(AREA_RADIUS_MIN, Math.ceil(farthest / 50) * 50),
  )
  const length = collected.lines.reduce((sum, line) => sum + pathLengthM(line), 0)
  return {
    latitude: Number(center.latitude.toFixed(7)),
    longitude: Number(center.longitude.toFixed(7)),
    radiusM,
    lengthM: length > 0 ? Math.round(length) : undefined,
  }
}
