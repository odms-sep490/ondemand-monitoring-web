import { render, waitFor, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { FlightPage } from '../FlightPage'
import { missionApi } from '../../../../mission/api/missionApi'

vi.mock('../components/InFlightControl', () => ({ default: () => <div>Live flight controls</div> }))
vi.mock('../../../../mission/api/missionApi', () => ({ missionApi: { getMissionById: vi.fn(), getPermissions: vi.fn() } }))
beforeEach(() => { vi.resetAllMocks(); window.location.hash = ''; })

it.each([false, true])('never mounts live controls for a closed flight, Inspector=%s', async (inspector) => {
  vi.mocked(missionApi.getMissionById).mockResolvedValue({ id: 'm', status: 'IN_PROGRESS', actualEndAt: '2026-11-16T10:20:00Z', deviceId: 'd' } as never)
  vi.mocked(missionApi.getPermissions).mockResolvedValue({ canControlFlight: true, canAccessMissionInspection: inspector } as never)
  render(<FlightPage missionId="m" />)
  await waitFor(() => expect(window.location.hash).toBe(inspector ? '#portal/staff/inspection/m' : '#portal/staff/missions/m'))
  expect(screen.queryByText('Live flight controls')).toBeNull()
})
