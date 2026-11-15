import { ApiError } from '../../../shared/api/httpClient'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { operatorMediaApi } from '../api/operatorMediaApi'
import { uploadStaffMediaBatch } from './uploadStaffMediaBatch'
import type { StaffFileSelection } from '../capture/captureTime'
vi.mock('../api/operatorMediaApi', () => ({
  operatorMediaApi: { uploadStaffFile: vi.fn() },
}))
beforeEach(() => vi.clearAllMocks())
describe('Shared Staff upload batch', () => {
  it('limits concurrent transfers to two, retains exact scope and never retries failed files', async () => {
    let running = 0,
      maximum = 0
    const files: StaffFileSelection[] = [1, 2, 3, 4].map((n) => ({
      file: new File(['photo'], `${n}.jpg`),
      capturedAt: '2026-11-10T01:00:00Z',
      declaration: { captureTimeSource: 'METADATA', captureTimeZone: 'UTC' },
    }))
    vi.mocked(operatorMediaApi.uploadStaffFile).mockImplementation(
      async (_mission, _device, file) => {
        running++
        maximum = Math.max(maximum, running)
        await new Promise((resolve) => setTimeout(resolve, 1))
        running--
        if (file.name === '2.jpg') throw new Error('Mất kết nối')
        return file.name
      },
    )
    const result = await uploadStaffMediaBatch({
      missionId: 'exact-mission',
      deviceId: 'exact-device',
      files,
    })
    expect(maximum).toBe(2)
    expect(result).toEqual({ submitted: 3, failures: ['2.jpg: Mất kết nối'] })
    expect(operatorMediaApi.uploadStaffFile).toHaveBeenCalledTimes(4)
    files.forEach((item) =>
      expect(operatorMediaApi.uploadStaffFile).toHaveBeenCalledWith(
        'exact-mission',
        'exact-device',
        item.file,
        item.capturedAt,
        undefined,
        item.declaration,
        undefined,
      ),
    )
  })
  it('explains a removed file without leaking the backend code or retrying it', async () => {
    vi.mocked(operatorMediaApi.uploadStaffFile).mockRejectedValue(
      new ApiError('Media not found', {
        code: 'MEDIA_REMOVED',
        status: 409,
        method: 'POST',
        path: '/staff-media-uploads',
      }),
    )
    const result = await uploadStaffMediaBatch({
      missionId: 'mission',
      deviceId: 'device',
      files: [
        {
          file: new File(['photo'], 'image-share.png'),
          capturedAt: '2026-11-10T01:00:00Z',
          declaration: {
            captureTimeSource: 'METADATA',
            captureTimeZone: 'UTC',
          },
        },
      ],
    })
    expect(result.submitted).toBe(0)
    expect(result.failures[0]).toContain('Hãy chọn lại tệp để bắt đầu lần tải mới')
    expect(result.failures[0]).not.toContain('MEDIA_REMOVED')
    expect(operatorMediaApi.uploadStaffFile).toHaveBeenCalledOnce()
  })
})
