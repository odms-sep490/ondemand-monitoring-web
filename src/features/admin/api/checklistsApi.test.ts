import { afterEach, expect, it, vi } from 'vitest'
import { checklistsApi } from './checklistsApi'
import {
  setHttpTransport,
  resetHttpTransport,
} from '../../../shared/api/httpClient'

afterEach(resetHttpTransport)
function transport() {
  const fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ success: true, data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  setHttpTransport(fetch)
  return fetch
}
it('serializes pageable query as separate params and omits empty search', async () => {
  const fetch = transport()
  await checklistsApi.list('', undefined, 0)
  const url = new URL(fetch.mock.calls[0][0])
  expect(url.pathname).toBe('/api/admin/checklists')
  expect(url.searchParams.get('page')).toBe('0')
  expect(url.searchParams.get('size')).toBe('20')
  expect(url.searchParams.get('sort')).toBe('createdAt,desc')
  expect(url.searchParams.has('search')).toBe(false)
})
it('sends content only and activation uses soft status mutation', async () => {
  const fetch = transport()
  await checklistsApi.create('Requirement')
  await checklistsApi.status('id', false)
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    content: 'Requirement',
  })
  expect(fetch.mock.calls[1][1].method).toBe('PATCH')
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ active: false })
})
it('sends atomic reorder membership and versions', async () => {
  const fetch = transport()
  await checklistsApi.reorder('s/1', [
    {
      id: 'link',
      serviceId: 's/1',
      serviceName: 'Test',
      serviceActive: true,
      checklistId: 'c',
      content: 'Test',
      checklistActive: true,
      displayOrder: 0,
      version: 7,
      checklistVersion: 3,
    },
  ])
  expect(new URL(fetch.mock.calls[0][0]).pathname).toBe(
    '/api/admin/services/s%2F1/checklists/order',
  )
  expect(fetch.mock.calls[0][1].method).toBe('PUT')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    items: [{ checklistId: 'c', expectedVersion: 7 }],
  })
})
