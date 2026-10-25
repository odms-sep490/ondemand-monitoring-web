import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import InFlightControl from '../components/InFlightControl'
import type { Drone, Mission } from '../../../types/omss'

// `PreflightScreen` (owned by another Phase 2 agent, mid-edit) is only
// reachable through this embedded panel when `preflightReady` is false. This
// test always sets `preflightReady` to true, so the panel never renders, but
// the module is still imported at the top of `InFlightControl.tsx` — stub it
// out so this test does not depend on that unrelated file's current state.
vi.mock('../../Preflight/PreflightPage', () => ({
  PreflightChecklistPanel: () => null,
}))

const mission = {
  id: 'MS-1',
  orderRef: 'ORD-1',
  title: 'Mission',
  state: 'IN_FLIGHT',
  priority: 'NORMAL',
  droneId: 'DRN-1',
  operatorId: 'OP-1',
  customer: 'Customer',
  location: 'Loc',
  lat: 0,
  lng: 0,
  scheduledAt: new Date().toISOString(),
  estimatedMinutes: 20,
  distanceKm: 2,
  flightPlanId: 'PLAN-1',
  maxAltitudeM: 60,
  notes: '',
} as Mission

const drone = {
  id: 'DRN-1',
  name: 'DRN-1',
  model: 'X500',
  serialNumber: 'DRN-1',
  state: 'ACTIVE_MISSION',
  battery: 90,
  gpsCount: 10,
  storageMB: 100,
} as Drone

describe('InFlightControl', () => {
  beforeEach(() => {
    // Skip the embedded preflight checklist overlay so the test only has to
    // deal with the in-flight HUD itself.
    window.localStorage.setItem(
      `omss.droneOperator.preflightReady.${mission.id}.${drone.id}`,
      'true',
    )
    // The HUD polls several control/telemetry endpoints on mount; every call
    // site wraps its fetch in try/catch, so a rejected fetch is handled the
    // same way an offline controller would be.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network disabled in test'))),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    setLanguage('vi')
  })

  it('renders Vietnamese text by default', () => {
    render(
      <InFlightControl
        mission={mission}
        drone={drone}
        onRTB={vi.fn()}
        onEmergency={vi.fn()}
        autoStartPlan={false}
        onAutoStartPlanConsumed={vi.fn()}
      />,
    )
    expect(screen.getByText('Phi công drone')).toBeInTheDocument()
    expect(
      screen.getByRole('application', { name: 'Live satellite flight map' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Đang chờ GPS từ PX4')).toBeInTheDocument()
  })

  it('renders English text after switching language', () => {
    render(
      <InFlightControl
        mission={mission}
        drone={drone}
        onRTB={vi.fn()}
        onEmergency={vi.fn()}
        autoStartPlan={false}
        onAutoStartPlanConsumed={vi.fn()}
      />,
    )
    act(() => setLanguage('en'))
    expect(screen.getByText('Drone Operator')).toBeInTheDocument()
    expect(screen.getByText('Waiting for PX4 GPS')).toBeInTheDocument()
  })

  it('keeps full cockpit termination accessible during safe-stop without reopening preflight', () => {
    vi.stubEnv('VITE_FLIGHT_MAP_ONLY', 'false')
    window.localStorage.removeItem(
      `omss.droneOperator.preflightReady.${mission.id}.${drone.id}`,
    )
    render(
      <InFlightControl
        mission={mission}
        drone={drone}
        normalFlightAllowed={false}
        terminationAllowed={true}
        operationalMessage="Đang dừng an toàn"
        onRTB={vi.fn()}
        onEmergency={vi.fn()}
        autoStartPlan={false}
        onAutoStartPlanConsumed={vi.fn()}
      />,
    )
    expect(screen.getByText('Đang dừng an toàn')).toBeInTheDocument()
    expect(screen.queryByText('Kiểm tra thủ công')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cất cánh' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Tiến' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nhiệt TẮT' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hạ cánh' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Dừng khẩn' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Hoàn thành bay' })).toBeEnabled()
  })

  it('fails closed in full cockpit when no normal or termination capability is provided', () => {
    vi.stubEnv('VITE_FLIGHT_MAP_ONLY', 'false')
    render(
      <InFlightControl
        mission={mission}
        drone={drone}
        onRTB={vi.fn()}
        onEmergency={vi.fn()}
        autoStartPlan={false}
        onAutoStartPlanConsumed={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Cất cánh' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Hạ cánh' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Hoàn thành bay' }),
    ).toBeDisabled()
  })

  it('opens Mission detail by backend identity, not the displayed Mission code', () => {
    vi.stubEnv('VITE_FLIGHT_MAP_ONLY', 'false')
    render(
      <InFlightControl
        mission={{ ...mission, backendId: 'exact-mission-uuid' }}
        drone={drone}
        onRTB={vi.fn()}
        onEmergency={vi.fn()}
        autoStartPlan={false}
        onAutoStartPlanConsumed={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }))
    expect(window.location.hash).toContain('exact-mission-uuid')
    expect(window.location.hash).not.toContain('MS-1')
  })

  it('preserves normal flight and finish actions after preflight is ready', () => {
    vi.stubEnv('VITE_FLIGHT_MAP_ONLY', 'false')
    render(
      <InFlightControl
        mission={mission}
        drone={drone}
        normalFlightAllowed={true}
        terminationAllowed={false}
        onRTB={vi.fn()}
        onEmergency={vi.fn()}
        autoStartPlan={false}
        onAutoStartPlanConsumed={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Cất cánh' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Hoàn thành bay' })).toBeEnabled()
  })

  it('starts a ready mission from the cockpit', async () => {
    const onStartFlight = vi.fn().mockResolvedValue(undefined)
    render(
      <InFlightControl
        mission={{ ...mission, state: 'READY_TO_FLY' }}
        drone={drone}
        normalFlightAllowed={true}
        onRTB={vi.fn()}
        onEmergency={vi.fn()}
        autoStartPlan={false}
        onAutoStartPlanConsumed={vi.fn()}
        onStartFlight={onStartFlight}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Bắt đầu chuyến bay' }),
    )
    await vi.waitFor(() => expect(onStartFlight).toHaveBeenCalledOnce())
  })
})
