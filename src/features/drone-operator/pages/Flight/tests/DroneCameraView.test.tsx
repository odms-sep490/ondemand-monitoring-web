import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { cameraZoomForAltitude } from '../components/CameraSatelliteMap'
import { DroneCameraView } from '../components/DroneCameraView'

describe('DroneCameraView', () => {
  it('shows a waiting state without telemetry and does not crash', () => {
    const { container } = render(<DroneCameraView telemetry={null} />)
    expect(screen.getByText('ĐANG CHỜ TELEMETRY')).toBeInTheDocument()
    expect(container.querySelector('.camera-hud')).not.toBeNull()
  })

  it('renders HUD values from telemetry instead of hardcoded numbers', () => {
    const { container } = render(
      <DroneCameraView
        telemetry={{
          latitude: 10.7635, longitude: 106.68678, heading: 299,
          altitude: 42, speedMps: 3.5, batteryPercent: 71,
        }}
      />,
    )
    expect(screen.queryByText('ĐANG CHỜ TELEMETRY')).toBeNull()
    expect(container.querySelector('.camera-hud__heading-value')?.textContent).toBe('299°')
    expect(screen.getByText('3.5')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('PIN 71%')).toBeInTheDocument()
    expect(screen.getByText('10.76350 N')).toBeInTheDocument()
    expect(screen.getByText('106.68678 E')).toBeInTheDocument()
  })

  it('picks a closer zoom at lower altitude', () => {
    expect(cameraZoomForAltitude(20)).toBe(18)
    expect(cameraZoomForAltitude(45)).toBe(18)
    expect(cameraZoomForAltitude(80)).toBe(18)
    expect(cameraZoomForAltitude(120)).toBe(17.5)
    expect(cameraZoomForAltitude(150)).toBe(17)
    expect(cameraZoomForAltitude(undefined)).toBe(18)
  })
})
