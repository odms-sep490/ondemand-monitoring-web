import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SatelliteFlightMap } from '../components/SatelliteFlightMap'

describe('SatelliteFlightMap', () => {
  it('waits for PX4 GPS before drawing the drone', () => {
    const target = { latitude: 10.84, longitude: 106.8 }
    const view = render(<SatelliteFlightMap missionId="MS-1" target={target} drone={null} />)
    const droneArrow = () => view.container.querySelector('.satellite-drone-arrow')

    expect(droneArrow()).toBeNull()
    view.rerender(
      <SatelliteFlightMap
        missionId="MS-1"
        target={target}
        drone={{ latitude: 10.8401, longitude: 106.8001 }}
      />,
    )

    expect(droneArrow()).not.toBeNull()

    view.rerender(<SatelliteFlightMap missionId="MS-1" target={target} drone={null} />)
    expect(droneArrow()).toBeNull()
  })
})
