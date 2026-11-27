import { afterEach, expect, it, vi } from 'vitest'
import { aiOpsApi } from './aiOpsApi'
import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'

afterEach(resetHttpTransport)

it('fetches historical traces by encoded correlation ID', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { traceId: 'AI-history' } }), { status: 200 }))
  setHttpTransport(fetch)
  await aiOpsApi.getTrace('AI-history/value')
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/api/admin/ai-ops/traces/AI-history%2Fvalue')
  expect(fetch.mock.calls[0][1].method).toBe('GET')
})
