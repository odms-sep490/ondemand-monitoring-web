import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from '../../../shared/api/httpClient'
import { busyScheduleApi } from './busyScheduleApi'

vi.mock('../../../shared/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../shared/api/httpClient')>()),
  apiRequest: vi.fn(),
}))

const request = vi.mocked(apiRequest)

beforeEach(() => {
  request.mockReset()
  request.mockResolvedValue({})
})

describe('busyScheduleApi', () => {
  it('reads my week with the date query', async () => {
    await busyScheduleApi.getMyWeek('2026-09-21')
    expect(request).toHaveBeenCalledWith('/api/busy-schedules/me', {
      query: { date: '2026-09-21' },
      signal: undefined,
    })
  })

  it('reads a staff week (manager) with an encoded id', async () => {
    await busyScheduleApi.getStaffWeek('a/b', '2026-09-21')
    expect(request.mock.calls[0][0]).toBe('/api/busy-schedules/users/a%2Fb')
  })

  it('creates, updates and cancels busy sessions', async () => {
    await busyScheduleApi.create({ date: '2026-09-22', session: 'MORNING' })
    await busyScheduleApi.update('b1', { date: '2026-09-22', session: 'EVENING' })
    await busyScheduleApi.remove('b1')
    expect(request.mock.calls).toEqual([
      [
        '/api/busy-schedules',
        { method: 'POST', body: { date: '2026-09-22', session: 'MORNING' } },
      ],
      [
        '/api/busy-schedules/b1',
        { method: 'PUT', body: { date: '2026-09-22', session: 'EVENING' } },
      ],
      ['/api/busy-schedules/b1', { method: 'DELETE' }],
    ])
  })
})
