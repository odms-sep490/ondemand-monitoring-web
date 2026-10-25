import { fireEvent, render, screen } from '@testing-library/react'
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
  it('keeps landing/return but disables new flight during safe-stop', () => {
    renderCockpit({
      canFly: false,
      canTerminate: true,
      statusMessage: 'Đang dừng an toàn',
    })
    expect(screen.getByRole('button', { name: /Cất cánh/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Bay tới điểm/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Chụp ảnh/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Quay về/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Hạ cánh/ })).toBeEnabled()
  })
  it('locks all commands after confirmation', () => {
    renderCockpit({ canFly: false, canTerminate: false })
    expect(screen.getByRole('button', { name: /Cất cánh/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Hạ cánh/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Dừng khẩn cấp/ })).toBeDisabled()
  })
  it('shows live telemetry values', () => {
    renderCockpit()
    expect(screen.getByText('19.5')).toBeInTheDocument()
    expect(screen.getByText('CRUISE')).toBeInTheDocument()
    expect(screen.getByText('10.778900, 106.699700')).toBeInTheDocument()
  })

  it('requires a second press before sending emergency stop', () => {
    const onCommand = renderCockpit()
    const button = screen.getByRole('button', { name: /Dừng khẩn cấp/ })
    fireEvent.click(button)
    expect(onCommand).not.toHaveBeenCalled()
    expect(screen.getByText('Bấm lần nữa để xác nhận')).toBeInTheDocument()
    fireEvent.click(button)
    expect(onCommand).toHaveBeenCalledWith('emergency_stop')
  })

  it('disables fly-to-point when the target is not ready', () => {
    renderCockpit({ canFlyToTarget: false })
    expect(screen.getByRole('button', { name: /Bay tới điểm/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Cất cánh/ })).toBeEnabled()
  })
})
