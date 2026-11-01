import { describe, expect, it } from 'vitest'

import type { DeviceResponse } from '../types/devices'
import { computeDeviceStats, mapDevice, mapDevicePage } from './deviceMappers'

const dto: DeviceResponse = {
  id: 'dev-1',
  serialNumber: 'SN-001',
  name: ' Đại Bàng ',
  deviceModel: {
    id: 'm1',
    code: 'M350',
    modelName: 'Matrice 350',
    manufacturer: 'DJI',
  },
  status: 'AVAILABLE',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
  version: 3,
}

describe('deviceMappers', () => {
  it('maps a DTO to the UI device', () => {
    expect(mapDevice(dto)).toEqual({
      id: 'dev-1',
      serialNumber: 'SN-001',
      name: 'Đại Bàng',
      model: {
        id: 'm1',
        code: 'M350',
        name: 'Matrice 350',
        manufacturer: 'DJI',
      },
      status: 'AVAILABLE',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
      version: 3,
    })
  })

  it('falls back to the serial number and null model', () => {
    const d = mapDevice({ ...dto, name: null, deviceModel: null })
    expect(d.name).toBe('SN-001')
    expect(d.model).toBeNull()
  })

  it('maps a page envelope', () => {
    const page = mapDevicePage({
      items: [dto],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
      first: true,
      last: true,
    })
    expect(page.items).toHaveLength(1)
    expect(page.totalItems).toBe(1)
  })

  it('computes KPI counts', () => {
    const mk = (status: DeviceResponse['status']) =>
      mapDevice({ ...dto, status })
    expect(
      computeDeviceStats([
        mk('AVAILABLE'),
        mk('AVAILABLE'),
        mk('MAINTENANCE'),
        mk('OFFLINE'),
        mk('OUT_OF_SERVICE'),
        mk('IN_MISSION'),
      ]),
    ).toEqual({ total: 6, available: 2, maintenance: 1, offline: 2 })
  })
})
