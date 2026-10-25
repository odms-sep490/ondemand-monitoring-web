import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { customerMissionReportApi } from './customerMissionReportApi'

afterEach(resetHttpTransport)
describe('Customer report read API', () => {
  it('uses encoded Order/Mission pairs and maps public availability without calling operational endpoints', async () => {
    const mission = { orderId: 'o/a', missionId: 'm/b', reportAvailable: false }
    const response = {
      mission,
      reportAvailable: false,
      result: null,
      checklistItems: [],
    }
    const transport = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: [mission] })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: response })),
      )
    setHttpTransport(transport)
    expect(await customerMissionReportApi.list('o/a')).toEqual([mission])
    expect(await customerMissionReportApi.report('o/a', 'm/b')).toEqual(
      response,
    )
    expect(transport.mock.calls[0][0]).toContain(
      '/api/customer/orders/o%2Fa/missions',
    )
    expect(transport.mock.calls[1][0]).toContain(
      '/api/customer/orders/o%2Fa/missions/m%2Fb/report',
    )
  })
  it('rejects mismatched projection identifiers and propagates unauthorized responses without retries', async () => {
    const transport = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { mission: { orderId: 'other', missionId: 'm' } },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            code: 'ACCESS_DENIED',
            message: 'Denied',
          }),
          { status: 403 },
        ),
      )
    setHttpTransport(transport)
    await expect(customerMissionReportApi.report('o', 'm')).rejects.toThrow(
      'Invalid report scope',
    )
    await expect(customerMissionReportApi.list('o')).rejects.toBeInstanceOf(
      ApiError,
    )
    expect(transport).toHaveBeenCalledTimes(2)
  })
})
