import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FlightCockpit } from '../components/FlightCockpit'
import type { CockpitTelemetry } from '../components/cockpitTypes'

const telemetry: CockpitTelemetry = {
  latitude: 10.7789,
  longitude: 106.6997,
  altitudeM: 19.5,
  speedMps: 3.6,
  verticalMps: 0,
  headingDeg: 320,
  batteryPercent: 97.3,
  inAir: true,
  flightMode: 'CRUISE',
  baseDistanceKm: 0.26,
  targetDistanceKm: 9.51,
}

function renderCockpit(
  overrides: Partial<Parameters<typeof FlightCockpit>[0]> = {},
) {
  const onCommand = vi.fn()
  render(
    <FlightCockpit
      language="vi"
      missionLabel="MS-1"
      roleLabel="Phi công drone"
      liveLabel="TRỰC TIẾP"
      online
      waitingGpsLabel="Đang chờ GPS từ PX4"
      statusMessage=""
      telemetry={telemetry}
      camera={<div />}
      map={<div />}
      busy={false}
      canFly
      canFlyToTarget
      referenceBusy={false}
      onCommand={onCommand}
      onReview={vi.fn()}
      onReferenceCapture={vi.fn()}
      {...overrides}
    />,
  )
  return onCommand
}

describe('FlightCockpit', () => {
  it('locks all commands after confirmation', () => {
    renderCockpit({ canFly: false })
    expect(screen.getByRole('button', { name: /Cất cánh/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Hạ cánh/ })).toBeDisabled()
  })
  it('shows live telemetry values', () => {
    renderCockpit()
    expect(screen.getByText('19.5')).toBeInTheDocument()
    expect(screen.getByText('CRUISE')).toBeInTheDocument()
    expect(screen.getByText('10.778900, 106.699700')).toBeInTheDocument()
  })

  it('disables fly-to-point when the target is not ready', () => {
    renderCockpit({ canFlyToTarget: false })
    expect(screen.getByRole('button', { name: /Bay tới điểm/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Cất cánh/ })).toBeEnabled()
  })
})
