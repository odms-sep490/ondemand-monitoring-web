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
