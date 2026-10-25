import { afterEach, expect, it, vi } from 'vitest'
import { droneApi } from './droneApi'
import { authenticatedFetch } from '../../auth/api/authApi'
vi.mock('../../auth/api/authApi', () => ({ authenticatedFetch: vi.fn() }))
afterEach(() => vi.resetAllMocks())
it('uses scoped availability and retains the own RESERVED device approved by the backend', async () => {
  vi.mocked(authenticatedFetch).mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [{ id: 'own', serialNumber: 'D1', status: 'RESERVED' }],
      }),
      { status: 200 },
    ),
  )
  expect((await droneApi.getAvailable('mission/1'))[0].id).toBe('own')
  expect(authenticatedFetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/drones/available?missionId=mission%2F1'),
  )
})
it('keeps the legacy generic status filter for callers without a Mission', async () => {
  vi.mocked(authenticatedFetch).mockResolvedValue(
    new Response(
      JSON.stringify({
        data: {
          items: [
            { id: 'ready', status: 'AVAILABLE' },
            { id: 'busy', status: 'MAINTENANCE' },
          ],
        },
      }),
      { status: 200 },
    ),
  )
  expect((await droneApi.getAvailable()).map((d) => d.id)).toEqual(['ready'])
})
