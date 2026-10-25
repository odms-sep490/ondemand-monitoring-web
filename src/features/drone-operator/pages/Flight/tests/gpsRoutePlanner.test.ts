import { describe, expect, it } from 'vitest'
import {
  buildExecutableFlightRoute,
  buildFlightPath,
  segmentCrossesPolygon,
  tanSonNhatNoFlyZone,
  type GpsPoint,
} from '../gpsRoutePlanner'

function routeCrossesZone(route: GpsPoint[]) {
  return route.some((point, index) => {
    const next = route[index + 1]
    return next
      ? segmentCrossesPolygon(point, next, tanSonNhatNoFlyZone.coordinates)
      : false
  })
}

describe('gpsRoutePlanner', () => {
  it('builds an executable route that avoids Tan Son Nhat no-fly zone', () => {
    const from = { latitude: 10.844703, longitude: 106.644064 }
    const to = { latitude: 10.7785, longitude: 106.6995 }

    expect(segmentCrossesPolygon(from, to, tanSonNhatNoFlyZone.coordinates)).toBe(true)

    const route = buildExecutableFlightRoute(from, to, [])

    expect(route.length).toBeGreaterThan(2)
    expect(route[0]).toEqual(from)
    expect(route[route.length - 1]).toEqual(to)
    expect(routeCrossesZone(route)).toBe(false)

    const displayRoute = buildFlightPath(from, to, [])

    expect(displayRoute.length).toBeGreaterThan(2)
    expect(routeCrossesZone(displayRoute)).toBe(false)
  })
})
