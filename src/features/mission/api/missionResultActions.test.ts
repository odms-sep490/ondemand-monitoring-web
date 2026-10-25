import { afterEach, describe, expect, it, vi } from 'vitest'
import { missionApi } from './missionApi'
import { authenticatedFetch } from '../../auth/api/authApi'

vi.mock('../../auth/api/authApi', () => ({ authenticatedFetch: vi.fn() }))
afterEach(() => vi.resetAllMocks())
describe('Operational acceptance / business submission endpoint contract', () => {
  it('completion sends one POST to /complete without a result payload', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 'm1', status: 'COMPLETED' } })),
    )
    await missionApi.completeMission('m1')
    expect(authenticatedFetch).toHaveBeenCalledOnce()
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/missions\/m1\/complete$/),
      expect.objectContaining({ method: 'POST' }),
    )
    expect(vi.mocked(authenticatedFetch).mock.calls[0][1]?.body).toBeUndefined()
  })
  it('submission sends one POST to exact Mission /result, never /complete', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { missionId: 'm1', approvalStatus: 'PENDING_MANAGER_APPROVAL' },
        }),
      ),
    )
    const body = { status: 'COMPLETED' as const, summary: 'Result for M1' }
    await missionApi.submitMissionResult('m1', body)
    expect(authenticatedFetch).toHaveBeenCalledOnce()
    expect(authenticatedFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/missions\/m1\/result$/),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }),
    )
  })
})
