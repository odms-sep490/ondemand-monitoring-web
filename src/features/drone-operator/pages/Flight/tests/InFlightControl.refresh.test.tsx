import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import InFlightControl from '../components/InFlightControl'
import type { Drone, Mission } from '../../../types/omss'

const monitoring = vi.hoisted(() => ({ refresh: () => {}, reloads: vi.fn() }))
vi.mock('../../../../mission/hooks/useMissionMonitoring', async () => {
  const { useState } = await import('react')
  return {
    useMissionMonitoring: () => {
      const [revision, setRevision] = useState(0)
      monitoring.refresh = () => { monitoring.reloads(); setRevision(value => value + 1) }
      return {
        reload: monitoring.refresh, loading: false, error: undefined,
        data: { checklist: { executions: [{ id: 'e1' }], readyForSubmission: revision > 0 } },
      }
    },
  }
})
vi.mock('../components/MissionChecklistPanel', () => ({
  MissionChecklistPanel: ({ onChecklistChanged }: { onChecklistChanged: () => void }) => (
    <button onClick={onChecklistChanged}>Evidence attached</button>
  ),
}))
const mission = {
  id: 'MS-1', backendId: 'm1', state: 'IN_FLIGHT', lat: 10.77, lng: 106.7,
  estimatedMinutes: 20, maxAltitudeM: 60,
} as Mission
const drone = { id: 'd1', name: 'Drone', battery: 90 } as Drone
beforeEach(() => {
  monitoring.reloads.mockClear()
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

it('attaching evidence refreshes completion without replacing camera or controls or navigating', () => {
  vi.stubEnv('VITE_FLIGHT_MAP_ONLY', 'false')
  const review = vi.fn()
  const { container } = render(<InFlightControl mission={mission} drone={drone}
    normalFlightAllowed onRTB={vi.fn()} onEmergency={vi.fn()} onReviewMedia={review}
    autoStartPlan={false} onAutoStartPlanConsumed={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Danh sách kiểm tra' }))
  const camera = container.querySelector('.mission-control-camera-card img')!
  const source = camera.getAttribute('src')
  const controls = container.querySelector('.mission-control-controls')
  const takeoff = screen.getByRole('button', { name: 'Cất cánh' })
  const hash = window.location.hash
  expect(screen.getByRole('button', { name: 'Hoàn thành bay' })).toBeDisabled()
  fireEvent.click(screen.getByText('Evidence attached'))
  expect(monitoring.reloads).toHaveBeenCalledOnce()
  expect(screen.getByRole('button', { name: 'Hoàn thành bay' })).toBeEnabled()
  expect(container.querySelector('.mission-control-camera-card img')).toBe(camera)
  expect(camera).toHaveAttribute('src', source)
  expect(container.querySelector('.mission-control-controls')).toBe(controls)
  expect(screen.getByRole('button', { name: 'Cất cánh' })).toBe(takeoff)
  expect(window.location.hash).toBe(hash)
  expect(review).not.toHaveBeenCalled()
})

it('completion refresh preserves the satellite map and cockpit control state', () => {
  vi.stubEnv('VITE_FLIGHT_MAP_ONLY', 'true')
  const { container } = render(<InFlightControl mission={mission} drone={drone}
    normalFlightAllowed onRTB={vi.fn()} onEmergency={vi.fn()}
    autoStartPlan={false} onAutoStartPlanConsumed={vi.fn()} />)
  const map = container.querySelector('.camera-satellite-leaflet')
  expect(map).not.toBeNull()
  const camera = container.querySelector('.drone-camera-view')
  const controls = container.querySelector('.fc-side')
  const takeoff = screen.getByRole('button', { name: /Cất cánh/ })
  act(() => monitoring.refresh())
  expect(container.querySelector('.camera-satellite-leaflet')).toBe(map)
  expect(container.querySelector('.drone-camera-view')).toBe(camera)
  expect(container.querySelector('.fc-side')).toBe(controls)
  expect(screen.getByRole('button', { name: /Cất cánh/ })).toBe(takeoff)
})
