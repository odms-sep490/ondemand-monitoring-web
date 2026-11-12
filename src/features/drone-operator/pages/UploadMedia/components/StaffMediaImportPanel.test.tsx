import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StaffMediaImportPanel } from './StaffMediaImportPanel'
import { readCaptureTime } from '../../../../media/capture/captureTime'
vi.mock('../../../../media/capture/captureTime', async original => ({ ...await original<object>(), readCaptureTime: vi.fn() }))
beforeEach(() => vi.clearAllMocks())
const window = { flightStart: '2026-11-10T01:00:00Z', flightEnd: '2026-11-10T02:00:00Z' }

describe('Staff per-file capture confirmation', () => {
  it('keeps automatically detected times isolated for two selected files', async () => {
    vi.mocked(readCaptureTime).mockResolvedValueOnce({ instant: '2026-11-10T01:15:30Z', zone: 'UTC' })
      .mockResolvedValueOnce({ instant: '2026-11-10T01:20:30Z', zone: '+07:00' })
    const upload = vi.fn().mockResolvedValue(undefined)
    render(<StaffMediaImportPanel disabled={false} {...window} onUpload={upload} />)
    const a = new File(['a'], 'a.jpg'), b = new File(['b'], 'b.mp4')
    fireEvent.change(screen.getByLabelText('Thêm ảnh/video từ thẻ nhớ drone'), { target: { files: [a, b] } })
    expect(await screen.findByLabelText('Thời gian chụp/quay — giờ Việt Nam (UTC+7): a.jpg')).toHaveValue('2026-11-10T08:15:30.000')
    expect(screen.getByLabelText('Thời gian chụp/quay — giờ Việt Nam (UTC+7): b.mp4')).toHaveValue('2026-11-10T08:20:30.000')
    fireEvent.click(screen.getByRole('button', { name: 'Tải lên các tệp đã xác nhận' }))
    await waitFor(() => expect(upload).toHaveBeenCalledWith([
      { file: a, uploadIntentId: expect.any(String), capturedAt: '2026-11-10T01:15:30.000Z', declaration: { captureTimeSource: 'METADATA', captureTimeZone: 'UTC', captureTimeConfirmationReason: undefined } },
      { file: b, uploadIntentId: expect.any(String), capturedAt: '2026-11-10T01:20:30.000Z', declaration: { captureTimeSource: 'METADATA', captureTimeZone: '+07:00', captureTimeConfirmationReason: undefined } },
    ]))
  })
  it('lets Staff confirm a detected time without changing it and records the reason', async () => {
    vi.mocked(readCaptureTime).mockResolvedValue({ instant: '2026-11-10T01:15:30Z', zone: 'UTC' })
    const upload = vi.fn().mockResolvedValue(undefined)
    render(<StaffMediaImportPanel disabled={false} {...window} onUpload={upload} />)
    fireEvent.change(screen.getByLabelText('Thêm ảnh/video từ thẻ nhớ drone'), { target: { files: [new File(['x'], 'x.jpg')] } })
    fireEvent.click(await screen.findByLabelText('Staff xác nhận thủ công thời gian này: x.jpg'))
    const submit = screen.getByRole('button', { name: 'Tải lên các tệp đã xác nhận' })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Lý do xác nhận hoặc điều chỉnh thời gian: x.jpg'), { target: { value: 'Xác nhận từ log drone' } })
    fireEvent.click(submit)
    await waitFor(() => expect(upload).toHaveBeenCalledWith([expect.objectContaining({ capturedAt: '2026-11-10T01:15:30.000Z',
      declaration: { captureTimeSource: 'STAFF_CONFIRMED', captureTimeZone: 'Asia/Ho_Chi_Minh', captureTimeConfirmationReason: 'Xác nhận từ log drone' } })]))
  })
  it('requires a reason for missing metadata and rejects time outside the Mission', async () => {
    vi.mocked(readCaptureTime).mockResolvedValue(null)
    const upload = vi.fn()
    render(<StaffMediaImportPanel disabled={false} {...window} onUpload={upload} />)
    fireEvent.change(screen.getByLabelText('Thêm ảnh/video từ thẻ nhớ drone'), { target: { files: [new File(['x'], 'x.jpg')] } })
    const time = await screen.findByLabelText('Thời gian chụp/quay — giờ Việt Nam (UTC+7): x.jpg')
    const submit = screen.getByRole('button', { name: 'Tải lên các tệp đã xác nhận' })
    expect(submit).toBeDisabled()
    fireEvent.change(time, { target: { value: '2026-11-10T08:30' } })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Lý do xác nhận hoặc điều chỉnh thời gian: x.jpg'), { target: { value: 'Đã kiểm tra nhật ký drone' } })
    expect(submit).toBeEnabled()
    fireEvent.change(time, { target: { value: '2026-11-09T08:30' } })
    expect(submit).toBeDisabled()
    expect(upload).not.toHaveBeenCalled()
  })
  it('reuses the intent for a retry but creates a new intent when Staff selects the same file again', async () => {
    vi.mocked(readCaptureTime).mockResolvedValue({ instant: '2026-11-10T01:15:30Z', zone: 'UTC' })
    const upload = vi.fn().mockResolvedValue(undefined)
    render(<StaffMediaImportPanel disabled={false} {...window} onUpload={upload} />)
    const file = new File(['same'], 'same.jpg')
    const picker = screen.getByLabelText('Thêm ảnh/video từ thẻ nhớ drone')
    fireEvent.change(picker, { target: { files: [file] } })
    await screen.findByLabelText('Thời gian chụp/quay — giờ Việt Nam (UTC+7): same.jpg')
    const submit = screen.getByRole('button', { name: 'Tải lên các tệp đã xác nhận' })
    fireEvent.click(submit); await waitFor(() => expect(upload).toHaveBeenCalledTimes(1))
    const initial = upload.mock.calls[0][0][0].uploadIntentId
    fireEvent.click(submit); await waitFor(() => expect(upload).toHaveBeenCalledTimes(2))
    expect(upload.mock.calls[1][0][0].uploadIntentId).toBe(initial)
    fireEvent.change(picker, { target: { files: [file] } })
    await waitFor(() => expect(readCaptureTime).toHaveBeenCalledTimes(2))
    fireEvent.click(submit); await waitFor(() => expect(upload).toHaveBeenCalledTimes(3))
    expect(upload.mock.calls[2][0][0].uploadIntentId).not.toBe(initial)
  })

})
