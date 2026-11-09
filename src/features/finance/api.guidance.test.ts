import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  resetHttpTransport,
  setHttpTransport,
} from '../../shared/api/httpClient'
import { financeApi } from './api'
afterEach(resetHttpTransport)
describe('finance guidance API', () => {
  it('PUTs the exact guidance contract under the existing Manager base path', async () => {
    const transport = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { id: 'item', guidanceVersion: 1 },
        }),
        { status: 200 },
      ),
    )
    setHttpTransport(transport)
    const body = {
      expectedChecklistRevision: 2,
      expectedGuidanceVersion: 0,
      description: null,
      executionSteps: [],
      inputRequirements: [],
      expectedOutputs: [],
      confirm: false,
    }
    const result = await financeApi.saveChecklistGuidance(
      'order/id',
      'item/id',
      body,
    )
    expect(transport).toHaveBeenCalledWith(
      expect.stringContaining(
        '/api/manager/orders/order%2Fid/checklist-items/item%2Fid/guidance',
      ),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) }),
    )
    expect(result.guidanceVersion).toBe(1)
  })
})
