import { describe, expect, it } from 'vitest'

import {
  circleCoverageArea,
  closeCoverageRing,
  coverageAreaMetrics,
  formatAreaM2,
  formatLengthM,
  isValidCoverageArea,
  rectangleCoverageArea,
} from './coverageGeometry'
import type { CoverageAreaGeometry } from './types'

describe('monitoring coverage geometry', () => {
  it('draws a geographic rectangle with area, perimeter, and four vertices', () => {
    const rectangle = rectangleCoverageArea([106.69, 10.64], [106.692, 10.642])
    const metrics = coverageAreaMetrics(rectangle)

    expect(rectangle.coordinates[0]).toHaveLength(5)
    expect(metrics?.vertexCount).toBe(4)
    expect(metrics?.areaM2).toBeGreaterThan(40_000)
    expect(metrics?.areaM2).toBeLessThan(50_000)
    expect(metrics?.perimeterM).toBeGreaterThan(800)
    expect(isValidCoverageArea(rectangle)).toBe(true)
  })

  it('represents a circle as a closed, valid GeoJSON polygon', () => {
    const circle = circleCoverageArea([106.69, 10.64], 300)
    const metrics = coverageAreaMetrics(circle)

    expect(circle.type).toBe('Polygon')
    expect(circle.coordinates[0]).toHaveLength(65)
    expect(circle.coordinates[0][0]).toEqual(circle.coordinates[0].at(-1))
    expect(metrics?.areaM2).toBeGreaterThan(Math.PI * 300 ** 2 * 0.99)
    expect(metrics?.areaM2).toBeLessThan(Math.PI * 300 ** 2)
    expect(isValidCoverageArea(circle)).toBe(true)
  })

  it('closes a manually drawn point list and rejects self-intersections', () => {
    const points = [
      [0, 0],
      [1, 0],
      [0.5, 1],
    ] as [number, number][]
    const ring = closeCoverageRing(points)
    expect(ring).toHaveLength(4)
    expect(isValidCoverageArea({ type: 'Polygon', coordinates: [ring] })).toBe(
      true,
    )

    const bowTie: CoverageAreaGeometry = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [0, 0],
          [1, 1],
          [1, 0],
          [0, 1],
          [0, 0],
        ],
      ],
    }
    expect(isValidCoverageArea(bowTie)).toBe(false)
  })

  it('shows preview metrics while keeping an open drawing invalid for submission', () => {
    const openArea: CoverageAreaGeometry = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [0, 0],
          [0.01, 0],
          [0, 0.01],
        ] as [number, number][],
      ],
    }

    expect(coverageAreaMetrics(openArea)?.vertexCount).toBe(3)
    expect(isValidCoverageArea(openArea)).toBe(false)
  })

  it('formats area and perimeter with geographic units', () => {
    expect(formatAreaM2(3_000)).toBe('3,000 m²')
    expect(formatAreaM2(30_000)).toBe('3.00 ha')
    expect(formatLengthM(300)).toBe('300 m')
    expect(formatLengthM(1_500)).toBe('1.50 km')
  })
})
