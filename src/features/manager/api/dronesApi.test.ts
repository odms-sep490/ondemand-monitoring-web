import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { dronesApi } from './dronesApi'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  resetHttpTransport()
})

describe('dronesApi.listDrones', () => {
  it('returns a list of drones', async () => {
    const result = await dronesApi.listDrones()
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.totalItems).toBeGreaterThan(0)
  })

  it('requests every page with page/size params and no unsupported filters', async () => {
    const urls: string[] = []
    setHttpTransport(async (input) => {
      urls.push(String(input))
      const page = Number(new URL(String(input)).searchParams.get('page'))
      return Response.json({
        success: true,
        data: {
          items: [
            { id: `d${page}`, serialNumber: `SN${page}`, status: 'AVAILABLE' },
          ],
          page,
          size: 100,
          totalItems: 2,
          totalPages: 2,
          first: page === 0,
          last: page === 1,
        },
      })
    })
    const result = await dronesApi.listDrones()
    const first = new URL(urls[0]).searchParams
    expect(urls).toHaveLength(2)
    expect(first.get('page')).toBe('0')
    expect(first.get('size')).toBe('100')
    expect(first.has('pageSize')).toBe(false)
    expect(first.has('status')).toBe(false)
    expect(result.items.map((d) => d.id)).toEqual(['d0', 'd1'])
  })
})

describe('dronesApi.updateDrone', () => {
  it('sends DeviceUpdateRequest to PUT /api/drones/{id}', async () => {
    let request: { path: string; method?: string; body?: unknown } | undefined
    setHttpTransport(async (input, init) => {
      request = {
        path: new URL(String(input)).pathname,
        method: init?.method,
        body: JSON.parse(String(init?.body)),
      }
      return Response.json({
        success: true,
        data: { id: 'd1', serialNumber: 'SN1', status: 'MAINTENANCE' },
      })
    })
    const result = await dronesApi.updateDrone('d1', {
      serialNumber: 'SN1',
      name: 'Falcon',
      modelId: 'model-1',
      status: 'MAINTENANCE',
    })
    expect(request).toEqual({
      path: '/api/drones/d1',
      method: 'PUT',
      body: {
        serialNumber: 'SN1',
        name: 'Falcon',
        modelId: 'model-1',
        status: 'MAINTENANCE',
      },
    })
    expect(result.status).toBe('MAINTENANCE')
  })

  it('throws on unknown drone', async () => {
    await expect(
      dronesApi.updateDrone('nonexistent', {
        serialNumber: 'SN999',
        status: 'AVAILABLE',
      }),
    ).rejects.toThrow()
  })
})
