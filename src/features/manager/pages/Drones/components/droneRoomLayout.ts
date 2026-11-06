export const CORE_DRONE_PADS = 6

const FIRST_EXPANSION_RING_CAPACITY = 8
const RING_CAPACITY_INCREMENT = 4
const FIRST_EXPANSION_RING_RADIUS = 9
const EXPANSION_RING_GAP = 3.4

export type ExpansionPadPosition = {
  x: number
  z: number
  ring: number
  radius: number
}

export function getExpansionPadPosition(extraIndex: number, totalExtraCount = extraIndex + 1): ExpansionPadPosition {
  if (!Number.isInteger(extraIndex) || extraIndex < 0 || !Number.isInteger(totalExtraCount) || totalExtraCount <= extraIndex) {
    throw new RangeError('extraIndex must identify a device inside a non-empty expansion layout')
  }

  let ring = 0
  let positionInRing = extraIndex
  let remainingDevices = totalExtraCount
  while (positionInRing >= FIRST_EXPANSION_RING_CAPACITY + ring * RING_CAPACITY_INCREMENT) {
    const ringCapacity = FIRST_EXPANSION_RING_CAPACITY + ring * RING_CAPACITY_INCREMENT
    positionInRing -= ringCapacity
    remainingDevices -= ringCapacity
    ring += 1
  }

  const ringCapacity = FIRST_EXPANSION_RING_CAPACITY + ring * RING_CAPACITY_INCREMENT
  const positionsInRing = Math.min(ringCapacity, remainingDevices)
  const radius = FIRST_EXPANSION_RING_RADIUS + ring * EXPANSION_RING_GAP
  const visibleArc = Math.min(Math.PI, positionsInRing * Math.PI / 8)
  const arcPosition = positionsInRing === 1 ? 0.5 : positionInRing / (positionsInRing - 1)
  const angle = Math.PI / 2 - visibleArc / 2 + arcPosition * visibleArc
    + (ring % 2) * visibleArc / Math.max(positionsInRing, 1) * 0.5

  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
    ring,
    radius,
  }
}

export function getDroneRoomExtent(droneCount: number) {
  const extraCount = Math.max(0, Math.floor(droneCount) - CORE_DRONE_PADS)
  if (extraCount === 0) return 8.4

  return Math.max(8.4, getExpansionPadPosition(extraCount - 1, extraCount).radius + 1.85)
}
