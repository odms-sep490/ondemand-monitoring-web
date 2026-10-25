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
  it('preserves replacement relations in list/detail and authoritative safe-stop fields', async () => {
    const replacement = { id: 'm2', replacesMissionId: 'm1' }
    const capability = {
      missionId: 'm2',
      status: 'IN_PROGRESS',
      requestedBy: 'manager',
      reason: 'Weather',
      confirmedBy: 'pilot',
      confirmation: 'Landed',
      canRequestSafeStop: false,
      canConfirmSafeStop: false,
      canCleanupSafeStop: true,
      canCancelMission: false,
    }
    const transport = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: [replacement] })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: replacement })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: capability })),
      )
    setHttpTransport(transport)
    expect(await planningApi.getOrderMissions('o')).toEqual([replacement])
    expect(await missionsApi.getMissionResponse('m2')).toEqual(replacement)
    expect(await planningApi.getSafeStop('m2')).toEqual(capability)
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
    await planningApi.requestSafeStop('mission-2', {
      expectedPlanRevision: 10,
      reason: 'Weather',
    })
    await planningApi.getSafeStop('mission-2')
    await planningApi.confirmSafeStop('mission-2', 'Landed and disarmed')
    await planningApi.cleanupSafeStop('mission-2')
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
    expect(JSON.parse(calls[9][1].body)).toEqual({
      landedAndDisarmed: true,
      controlSessionClosed: true,
      confirmation: 'Landed and disarmed',
    })
    expect(calls[10][1].method).toBe('POST')
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
