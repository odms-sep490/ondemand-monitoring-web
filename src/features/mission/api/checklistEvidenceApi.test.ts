import { describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../shared/api/httpClient'
import { checklistEvidenceApi } from './checklistEvidenceApi'
vi.mock('../../../shared/api/httpClient', () => ({
  apiRequest: vi.fn().mockResolvedValue([]),
}))
describe('customer selection API', () => {
  it('encodes identifiers and sends the expected execution version and surplus decision', async () => {
    const body = {
      expectedVersion: 7,
      evidenceIds: ['evidence-id'],
      confirmSurplus: true,
    }
    await checklistEvidenceApi.selectForCustomer(
      'mission/a',
      'execution/b',
      body,
    )
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/missions/mission%2Fa/checklist-executions/execution%2Fb/customer-selection',
      { method: 'PUT', body },
    )
  })
})
