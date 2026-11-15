import { afterEach, expect, it, vi } from 'vitest'
import * as http from '../../shared/api/httpClient'
import { contractApi } from './contractApi'
afterEach(() => vi.restoreAllMocks())
it('uses the backend multipart issue and submission contracts without a client confirmation flag', async () => {
  const request = vi.spyOn(http, 'apiRequest').mockResolvedValue({})
  const pdf = new File(['pdf'], 'contract.pdf', { type: 'application/pdf' })
  await contractApi.issue('order/id', 'quote', 'CTR-01', pdf)
  const [path, options] = request.mock.calls[0]
  expect(path).toBe('/api/orders/order%2Fid/contract/issue')
  expect(options?.method).toBe('POST')
  const body = options?.body as FormData
  expect(body.get('quoteId')).toBe('quote')
  expect(body.get('contractNumber')).toBe('CTR-01')
  expect(body.get('file')).toBe(pdf)
  await contractApi.submit('order', 7, pdf)
  const upload = request.mock.calls[1][1]?.body as FormData
  expect(upload.get('expectedVersion')).toBe('7')
  expect(upload.has('signed')).toBe(false)
  expect(request.mock.calls[1][0]).toBe(
    '/api/orders/order/contract/submissions',
  )
})
it('review is an explicit versioned manager operation on the exact submission', async () => {
  const request = vi.spyOn(http, 'apiRequest').mockResolvedValue({})
  await contractApi.confirm('order', 4, 'signed')
  expect(request).toHaveBeenCalledWith('/api/orders/order/contract/confirm', {
    method: 'POST',
    body: { expectedVersion: 4, submissionId: 'signed' },
  })
  await contractApi.requestChanges('order', 4, 'signed', 'missing signature')
  expect(request).toHaveBeenLastCalledWith(
    '/api/orders/order/contract/request-changes',
    {
      method: 'POST',
      body: {
        expectedVersion: 4,
        submissionId: 'signed',
        reason: 'missing signature',
      },
    },
  )
})

it('preparation uploads the pricing revision shown to Manager', async () => {
  const request = vi.spyOn(http, 'apiRequest').mockResolvedValue({})
  await contractApi.issue(
    'order',
    'quote',
    'CTR-02',
    new File(['pdf'], 'contract.pdf'),
    7,
  )
  expect(
    (request.mock.calls[0][1]?.body as FormData).get('expectedPricingRevision'),
  ).toBe('7')
})
it('reads and downloads the exact quote contract even before an invoice exists', async () => {
  const request = vi.spyOn(http, 'apiRequest').mockResolvedValue({})
  await contractApi.get('order', undefined, 'quote')
  expect(request).toHaveBeenLastCalledWith('/api/orders/order/contract', {
    signal: undefined,
    query: { quoteId: 'quote' },
  })
  await contractApi.download('order', undefined, 'quote')
  expect(request).toHaveBeenLastCalledWith(
    '/api/orders/order/contract/download',
    { method: 'POST', query: { submissionId: undefined, quoteId: 'quote' } },
  )
})

it('upload-only preparation does not send a user-entered contract number', async () => {
  const request = vi.spyOn(http, 'apiRequest').mockResolvedValue({})
  await contractApi.issue(
    'order',
    'quote',
    undefined,
    new File(['pdf'], 'contract.pdf'),
    7,
  )
  const body = request.mock.calls[0][1]?.body as FormData
  expect(body.has('contractNumber')).toBe(false)
  expect(body.get('expectedPricingRevision')).toBe('7')
})

it('cancellation sends an explicit idempotent command and a versioned decision', async () => {
  const request = vi.spyOn(http, 'apiRequest').mockResolvedValue(null)
  const body = {
    clientRequestId: '13520c90-a98c-4a2e-a6ca-4b20ab36f027',
    expectedVersion: 4,
    responsibility: 'UNRESOLVED' as const,
    reason: 'The parties cannot proceed',
    basis: null,
    customerLiabilityAcknowledged: false,
  }
  await contractApi.cancel('order/id', body)
  expect(request).toHaveBeenLastCalledWith(
    '/api/orders/order%2Fid/contract/cancellation',
    { method: 'POST', body },
  )
  const decision = {
    expectedVersion: 2,
    responsibility: 'SYSTEM' as const,
    basis: 'Provider cannot deliver the signed agreement',
    customerLiabilityAcknowledged: false,
  }
  await contractApi.decideCancellation('order/id', decision)
  expect(request).toHaveBeenLastCalledWith(
    '/api/orders/order%2Fid/contract/cancellation/decision',
    { method: 'POST', body: decision },
  )
})
