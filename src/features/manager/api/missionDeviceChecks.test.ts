import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../../../shared/api/httpClient'
import { missionsApi } from './missionsApi'

vi.mock('../../../shared/api/httpClient', () => ({ apiRequest: vi.fn().mockResolvedValue(null) }))

describe('per-device mission checks', () => {
  beforeEach(() => vi.clearAllMocks())
  it('requests each assigned drone independently', async () => {
    await missionsApi.getCurrentPreflight('mission', undefined, 'drone-one')
    await missionsApi.getCurrentPostDeviceCheck('mission', undefined, 'drone-two')
    expect(apiRequest).toHaveBeenNthCalledWith(1, '/api/missions/mission/pre-device-checks/current?deviceId=drone-one', { signal: undefined })
    expect(apiRequest).toHaveBeenNthCalledWith(2, '/api/missions/mission/post-device-checks/current?deviceId=drone-two', { signal: undefined })
  })
  it('preserves callers that request the mission default', async () => {
    await missionsApi.getCurrentPreflight('mission')
    expect(apiRequest).toHaveBeenCalledWith('/api/missions/mission/pre-device-checks/current', { signal: undefined })
  })
})
