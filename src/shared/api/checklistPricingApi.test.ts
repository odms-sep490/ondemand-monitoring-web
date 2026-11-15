import { afterEach, expect, it, vi } from 'vitest'
import { checklistPricingApi } from './checklistPricingApi'
import { resetHttpTransport, setHttpTransport } from './httpClient'
import { checklistsApi } from '../../features/admin/api/checklistsApi'

afterEach(resetHttpTransport)
function transport() {
  const fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  setHttpTransport(fetch)
  return fetch
}

it('reads the default service price from the admin endpoint', async () => {
  const fetch = transport()
  await checklistPricingApi.defaultPrice('s/1')
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe(
    '/api/admin/pricing/services/s%2F1/default-price',
  )
})

it('customer quote carries only the service, choices and quantities', async () => {
  const fetch = transport()
  await checklistPricingApi.customerQuote('s', [
    { sourceChecklistId: 'a', requestedImageCount: 30, requestedVideoCount: 3 },
    { content: 'Tự thêm', requestedImageCount: 2 },
  ])
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe(
    '/api/pricing/checklist-quote',
  )
  const body = JSON.parse(fetch.mock.calls[0][1].body)
  expect(body).toEqual({
    serviceId: 's',
    items: [
      {
        sourceChecklistId: 'a',
        requestedImageCount: 30,
        requestedVideoCount: 3,
      },
      { content: 'Tự thêm', requestedImageCount: 2 },
    ],
  })
  expect(JSON.stringify(body)).not.toMatch(/price|amount|total|cost/i)
})

it('checklist create/update send evidence requirements alongside the content', async () => {
  const fetch = transport()
  const pricing = {
    includedImageCount: 10,
    includedVideoCount: 1,
    standardVideoDurationSeconds: 30,
  }
  await checklistsApi.create('Requirement', pricing)
  await checklistsApi.update('id', 'Requirement', pricing)
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    content: 'Requirement',
    ...pricing,
  })
  expect(fetch.mock.calls[1][1].method).toBe('PUT')
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({
    content: 'Requirement',
    ...pricing,
  })
})

it('per-service evidence requirements use the association requirements endpoint with the row version', async () => {
  const fetch = transport()
  await checklistsApi.updateRequirements('s/1', 'c/2', {
    includedImageCountOverride: null,
    includedVideoCountOverride: 2,
    required: true,
    expectedVersion: 9,
  })
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe(
    '/api/admin/services/s%2F1/checklists/c%2F2/requirements',
  )
  expect(fetch.mock.calls[0][1].method).toBe('PUT')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    includedImageCountOverride: null,
    includedVideoCountOverride: 2,
    required: true,
    expectedVersion: 9,
  })
})
