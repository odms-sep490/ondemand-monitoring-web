import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  resetHttpTransport,
  setHttpTransport,
  ApiError,
} from '../../../shared/api/httpClient'
import { planningApi } from './planningApi'
import { missionsApi } from './missionsApi'

afterEach(resetHttpTransport)
describe('planning API contracts', () => {
  it('preserves replacement relations in list and detail', async () => {
    const replacement = { id: 'm2', replacesMissionId: 'm1' }
    const transport = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: [replacement] })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: replacement })),
      )
    setHttpTransport(transport)
    expect(await planningApi.getOrderMissions('o')).toEqual([replacement])
    expect(await missionsApi.getMissionResponse('m2')).toEqual(replacement)
    expect(
      transport.mock.calls.every(
        ([, options]) => !options.method || options.method === 'GET',
      ),
    ).toBe(true)
  })
  it('uses exact order/mission identities and backend request DTOs', async () => {
    const transport = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
      }),
    )
    setHttpTransport(transport)
    await planningApi.getOrderMissions('order-1')
    await planningApi.getExecutionPlan('order-1')
    await planningApi.getAssignments('mission-2')
    await planningApi.updateMissionChecklistAssignments('mission-2', 8, [
      'A',
      'E',
    ])
    await planningApi.finalizeExecutionPlan('order-1', 9)
    await planningApi.amendExecutionPlan('order-1', {
      expectedPlanRevision: 9,
      reason: 'Weather',
    })
    await planningApi.cancelMission('mission-2', {
      expectedPlanRevision: 10,
      reason: 'Cancelled',
    })
    const calls = transport.mock.calls
    expect(calls[0][0]).toContain('/api/orders/order-1/missions')
    expect(calls[2][0]).toContain(
      '/api/missions/mission-2/checklist-assignments',
    )
    expect(JSON.parse(calls[3][1].body)).toEqual({
      expectedPlanRevision: 8,
      items: [{ orderChecklistItemId: 'A' }, { orderChecklistItemId: 'E' }],
    })
    expect(JSON.parse(calls[4][1].body)).toEqual({
      expectedPlanRevision: 9,
      decompositionConfirmed: true,
    })
    expect(calls[6][0]).toContain('/api/missions/mission-2/cancel')
    expect(calls[6][1].method).toBe('POST')
  })
  it('propagates revision conflict and never retries mutation automatically', async () => {
    const transport = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          code: 'EXECUTION_PLAN_REVISION_CONFLICT',
          message: 'Stale',
        }),
        { status: 409 },
      ),
    )
    setHttpTransport(transport)
    await expect(
      planningApi.updateMissionChecklistAssignments('m', 3, ['A']),
    ).rejects.toBeInstanceOf(ApiError)
    expect(transport).toHaveBeenCalledTimes(1)
  })
})
