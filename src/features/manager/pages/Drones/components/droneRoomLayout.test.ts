import { describe, expect, it } from 'vitest'

import { getDroneRoomExtent, getExpansionPadPosition } from './droneRoomLayout'

describe('drone room expansion layout', () => {
  it('places additional pads around the room on an expanding circular ring', () => {
    const first = getExpansionPadPosition(0, 3)
    const second = getExpansionPadPosition(1, 3)
    const third = getExpansionPadPosition(2, 3)

    expect(first.ring).toBe(0)
    expect(first.radius).toBe(9)
    expect(Math.hypot(first.x, first.z)).toBeCloseTo(first.radius)
    expect(Math.hypot(second.x, second.z)).toBeCloseTo(second.radius)
    expect(Math.hypot(third.x, third.z)).toBeCloseTo(third.radius)
    expect(second).not.toEqual(first)
    expect(first.x + second.x + third.x).toBeCloseTo(0)
    expect(first.z).toBeGreaterThan(0)
    expect(second.z).toBeGreaterThan(0)
    expect(third.z).toBeGreaterThan(0)
  })

  it('starts a larger outer ring after the first ring fills', () => {
    const position = getExpansionPadPosition(8, 9)

    expect(position.ring).toBe(1)
    expect(position.radius).toBeGreaterThan(getExpansionPadPosition(7, 9).radius)
  })

  it('grows the rendered room extent after the six core pads are full', () => {
    expect(getDroneRoomExtent(6)).toBe(8.4)
    expect(getDroneRoomExtent(7)).toBeGreaterThan(getDroneRoomExtent(6))
    expect(getDroneRoomExtent(15)).toBeGreaterThan(getDroneRoomExtent(14))
  })
})
