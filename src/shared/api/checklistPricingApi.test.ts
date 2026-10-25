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

it('posts the unsaved what-if configuration to the admin preview', async () => {
  const fetch = transport()
  await checklistPricingApi.adminPreview({
    serviceId: 's',
    items: [{ checklistId: 'a', basePrice: 1 }],
  })
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe(
    '/api/admin/pricing/service-preview',
  )
  expect(fetch.mock.calls[0][1].method).toBe('POST')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    serviceId: 's',
    items: [{ checklistId: 'a', basePrice: 1 }],
  })
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

it('checklist create/update send the pricing configuration alongside the content', async () => {
  const fetch = transport()
  const pricing = {
    basePrice: 200_000,
    includedImageCount: 10,
    includedVideoCount: 1,
    standardVideoDurationSeconds: 30,
    pricingProfile: 'STANDARD',
  }
  await checklistsApi.create('Requirement', 'HARD', pricing)
  await checklistsApi.update('id', 'Requirement', 'HARD', pricing)
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    content: 'Requirement',
    difficulty: 'HARD',
    ...pricing,
  })
  expect(fetch.mock.calls[1][1].method).toBe('PUT')
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({
    content: 'Requirement',
    difficulty: 'HARD',
    ...pricing,
  })
})

it('per-service overrides use the association pricing endpoint with the row version', async () => {
  const fetch = transport()
  await checklistsApi.updatePricing('s/1', 'c/2', {
    basePriceOverride: 260_000,
    includedImageCountOverride: null,
    includedVideoCountOverride: 2,
    pricingProfileOverride: null,
    required: true,
    expectedVersion: 9,
  })
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe(
    '/api/admin/services/s%2F1/checklists/c%2F2/pricing',
  )
  expect(fetch.mock.calls[0][1].method).toBe('PUT')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    basePriceOverride: 260_000,
    includedImageCountOverride: null,
    includedVideoCountOverride: 2,
    pricingProfileOverride: null,
    required: true,
    expectedVersion: 9,
  })
})
