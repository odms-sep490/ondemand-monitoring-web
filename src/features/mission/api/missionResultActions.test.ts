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
  it('bounds generated summaries without truncating the detailed report or splitting Unicode characters', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify({ data: {} })),
    )
    await missionApi.submitMissionResult('m1', {
      status: 'COMPLETED',
      summary: 'x'.repeat(999) + '🚁',
      notes: 'Detailed report. '.repeat(200),
    })
    const body = JSON.parse(
      vi.mocked(authenticatedFetch).mock.calls[0][1]?.body as string,
    )
    expect(body.summary).toHaveLength(999)
    expect(body.summary).toBe('x'.repeat(999))
    expect(body.notes).toBe('Detailed report. '.repeat(200))
  })
})
