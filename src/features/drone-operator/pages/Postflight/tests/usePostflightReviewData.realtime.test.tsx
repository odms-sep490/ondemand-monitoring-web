import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { missionApi } from '../../../../mission/api/missionApi'
import { fetchCurrentPersistedPreflight } from '../../Preflight/preflightApi'
import {
  fetchLatestPostflightCheck,
  fetchLatestWeatherCheck,
} from '../../MissionDetail/checkData'
import { usePostflightReviewData } from '../usePostflightReviewData'
import type { WorkspaceComponent } from '../../../../mission/realtime/missionWorkspaceUpdates'

const realtime = vi.hoisted(() => ({
  change: undefined as
    undefined | ((parts: readonly WorkspaceComponent[]) => void),
}))
vi.mock('../../../../mission/realtime/useMissionWorkspaceUpdates', () => ({
  useMissionWorkspaceUpdates: (
    _id: string,
    _parts: unknown,
    callback: typeof realtime.change,
  ) => {
    realtime.change = callback
  },
}))
vi.mock('../../Preflight/preflightApi', () => ({
  fetchCurrentPersistedPreflight: vi.fn(),
}))
vi.mock('../../MissionDetail/checkData', () => ({
  fetchLatestPostflightCheck: vi.fn(),
  fetchLatestWeatherCheck: vi.fn(),
}))
beforeEach(() => {
  vi.spyOn(missionApi, 'getMissionById').mockResolvedValue({ id: 'm' } as never)
  vi.spyOn(missionApi, 'getMissionMedia').mockResolvedValue([])
  vi.mocked(fetchCurrentPersistedPreflight).mockResolvedValue(null)
  vi.mocked(fetchLatestPostflightCheck).mockResolvedValue(null)
  vi.mocked(fetchLatestWeatherCheck).mockResolvedValue(null)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

it('refreshes changed media without reloading flight checks or mission details', async () => {
  const { result } = renderHook(() => usePostflightReviewData('m'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  const previousMission = result.current.data!.mission
  vi.mocked(missionApi.getMissionMedia).mockResolvedValue([
    { id: 'image' },
  ] as never)
  act(() => realtime.change!(['media']))
  await waitFor(() => expect(result.current.data!.media).toHaveLength(1))
  expect(result.current.data!.mission).toBe(previousMission)
  expect(missionApi.getMissionMedia).toHaveBeenCalledTimes(2)
  expect(missionApi.getMissionById).toHaveBeenCalledTimes(1)
  expect(fetchCurrentPersistedPreflight).toHaveBeenCalledTimes(1)
  expect(fetchLatestWeatherCheck).toHaveBeenCalledTimes(1)
  expect(fetchLatestPostflightCheck).toHaveBeenCalledTimes(1)
})

it('updates mission access/status changes without refetching unchanged media', async () => {
  const { result } = renderHook(() => usePostflightReviewData('m'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  vi.mocked(missionApi.getMissionById).mockResolvedValue({
    id: 'm',
    status: 'COMPLETED',
  } as never)
  act(() => realtime.change!(['permissions']))
  await waitFor(() =>
    expect(result.current.data!.mission?.status).toBe('COMPLETED'),
  )
  expect(missionApi.getMissionMedia).toHaveBeenCalledTimes(1)
  expect(missionApi.getMissionById).toHaveBeenCalledTimes(2)
})
