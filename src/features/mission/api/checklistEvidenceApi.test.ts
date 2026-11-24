import { describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../shared/api/httpClient'
import { checklistEvidenceApi } from './checklistEvidenceApi'
vi.mock('../../../shared/api/httpClient', () => ({
  apiRequest: vi.fn().mockResolvedValue([]),
}))
describe('customer selection API', () => {
  it('requests delivery suggestions with encoded identifiers', async () => {
    await checklistEvidenceApi.getDeliverySuggestion('mission/a', 'execution/b')
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/missions/mission%2Fa/checklist-executions/execution%2Fb/delivery-suggestion',
    )
  })
  it('posts an individual image assessment with only version and language in the body', async () => {
    const signal = new AbortController().signal
    const body = { expectedVersion: 7, language: 'vi' } as const
    await checklistEvidenceApi.assessImageContent(
      'mission/a',
      'execution/b',
      'evidence/c',
      body,
      signal,
    )
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/missions/mission%2Fa/checklist-executions/execution%2Fb/evidence/evidence%2Fc/content-assessment',
      { method: 'POST', body, signal },
    )
  })
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
