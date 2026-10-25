import { describe, expect, it } from 'vitest'

import { resolveCockpitBatteryPercent } from './batteryTelemetry'

describe('resolveCockpitBatteryPercent', () => {
  it('prefers the live PX4/Gazebo value over the internal battery model', () => {
    expect(
      resolveCockpitBatteryPercent({
        batteryPercent: 100,
        rawPx4BatteryPercent: 97,
      }),
    ).toBe(97)
  })

  it('falls back to the internal value while PX4 telemetry is unavailable', () => {
    expect(
      resolveCockpitBatteryPercent({
        batteryPercent: 86.4,
        rawPx4BatteryPercent: null,
      }),
    ).toBe(86.4)
  })

  it('clamps invalid range values and returns null without telemetry', () => {
    expect(resolveCockpitBatteryPercent({ rawPx4BatteryPercent: 104 })).toBe(100)
    expect(resolveCockpitBatteryPercent(null)).toBeNull()
  })
})
