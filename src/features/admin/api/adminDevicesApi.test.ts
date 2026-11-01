import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from '../../../shared/api/httpClient'
import { adminDevicesApi } from './adminDevicesApi'

vi.mock('../../../shared/api/httpClient', () => ({ apiRequest: vi.fn() }))

const mocked = vi.mocked(apiRequest)

describe('adminDevicesApi', () => {
  beforeEach(() => {
    mocked.mockReset()
    mocked.mockResolvedValue({})
  })

  it('lists with 0-based paging and filters', async () => {
    await adminDevicesApi.list({
      page: 0,
      size: 20,
      keyword: 'abc',
      status: 'AVAILABLE',
      modelId: 'm1',
    })
    expect(mocked).toHaveBeenCalledWith('/api/devices', {
      query: {
        page: 0,
        size: 20,
        keyword: 'abc',
        status: 'AVAILABLE',
        modelId: 'm1',
      },
      signal: undefined,
    })
  })

  it('drops an empty keyword', async () => {
    await adminDevicesApi.list({ page: 1, size: 10, keyword: '' })
    expect(mocked.mock.calls[0][1]?.query?.keyword).toBeUndefined()
  })

  it('gets one device', async () => {
    await adminDevicesApi.get('a/b')
    expect(mocked.mock.calls[0][0]).toBe('/api/devices/a%2Fb')
  })

  it('creates with POST', async () => {
    const body = { serialNumber: 'SN', modelId: 'm1' }
    await adminDevicesApi.create(body)
    expect(mocked).toHaveBeenCalledWith('/api/devices', {
      method: 'POST',
      body,
    })
  })

  it('updates with PUT', async () => {
    await adminDevicesApi.update('d1', { name: 'X' })
    expect(mocked).toHaveBeenCalledWith('/api/devices/d1', {
      method: 'PUT',
      body: { name: 'X' },
    })
  })

  it('deletes with DELETE', async () => {
    await adminDevicesApi.remove('d1')
    expect(mocked).toHaveBeenCalledWith('/api/devices/d1', {
      method: 'DELETE',
    })
  })

  it('lists models from an array or a page envelope', async () => {
    const m = { id: '1', code: 'C', modelName: 'N', manufacturer: 'M' }
    mocked.mockResolvedValueOnce([m])
    expect(await adminDevicesApi.listModels()).toEqual([m])
    mocked.mockResolvedValueOnce({ items: [m] })
    expect(await adminDevicesApi.listModels()).toEqual([m])
    expect(mocked.mock.calls[0][0]).toBe('/api/device-models')
  })
})
