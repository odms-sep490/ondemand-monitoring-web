import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ImageQualityPanel } from './ImageQualityPanel'
import { apiRequest } from '../../../shared/api/httpClient'
vi.mock('../../../shared/api/httpClient', () => ({ apiRequest: vi.fn() }))
const api = vi.mocked(apiRequest)
describe('ImageQualityPanel', () => {
  beforeEach(() => { vi.resetAllMocks() })
  it('shows real measurements without claiming classifier success', async () => {
    api.mockResolvedValue([{ id: 'job', media_id: 'image', created_at: new Date().toISOString(), status: 'COMPLETED', decision: 'REVIEW_REQUIRED', result: {
      decision: 'REVIEW_REQUIRED', profileVersion: '1-provisional', algorithmVersion: 'quality-metrics-1.0',
      criteria: [{ code: 'BLUR', status: 'REVIEW_REQUIRED', message: 'Ảnh có dấu hiệu mờ' }], warnings: [], unchecked: ['Phân loại AI'], metrics: {}, classifier: { status: 'NOT_CONFIGURED' },
    } }])
    render(<ImageQualityPanel mediaId="image" customer />)
    expect(await screen.findByText('Ảnh có dấu hiệu mờ')).toBeInTheDocument()
    expect(screen.getByText('Kết quả tham khảo. Người duyệt xác nhận trước khi bàn giao.')).toBeInTheDocument()
    expect(screen.queryByText('Lưu quyết định')).not.toBeInTheDocument()
    expect(api).toHaveBeenCalledWith('/api/customer/media/image/quality-checks', expect.anything())
  })
  it('submits a persisted job and shows actual pending state', async () => {
    api.mockResolvedValueOnce([]).mockResolvedValueOnce({ id: 'job', media_id: 'image', created_at: new Date().toISOString(), status: 'PENDING' })
    render(<ImageQualityPanel mediaId="image" customer />)
    await screen.findByText('Chưa kiểm tra ảnh này.')
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra chất lượng AI' }))
    expect(await screen.findByText('Đang chờ')).toBeInTheDocument()
    expect(api).toHaveBeenLastCalledWith('/api/customer/media/image/quality-checks', expect.objectContaining({ method: 'POST', body: expect.objectContaining({ profile: 'PANORAMA' }) }))
  })
  it('enables review after polling returns a completed check and saves the Inspector decision', async () => {
    const job = { id: 'job', media_id: 'image', created_at: '2026-11-26T00:00:00Z' }
    const completed = { ...job, status: 'COMPLETED', decision: 'REVIEW_REQUIRED' }
    const onChanged = vi.fn()
    api.mockResolvedValueOnce([])
      .mockResolvedValueOnce({ ...job, status: 'PENDING' })
      .mockResolvedValueOnce(completed)
      .mockResolvedValueOnce({
        ...completed,
        reviews: [{ decision: 'PASS', note: 'Chi tiết cần kiểm tra vẫn rõ', reviewed_at: job.created_at }],
      })

    render(<ImageQualityPanel mediaId="image" onChanged={onChanged} />)
    const save = screen.getByRole('button', { name: 'Lưu quyết định' })
    await screen.findByText('Chưa kiểm tra ảnh này.')
    expect(save).toBeDisabled()
    expect(screen.getByText('Chọn Kiểm tra chất lượng AI và chờ kết quả để lưu quyết định.')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra chất lượng AI' }))
    expect(await screen.findByText('Đang kiểm tra chất lượng ảnh. Bạn có thể lưu quyết định khi có kết quả.')).toBeVisible()
    expect(save).toBeDisabled()
    expect(api).toHaveBeenCalledTimes(2)

    await waitFor(() => expect(save).toBeEnabled(), { timeout: 4000 })
    fireEvent.click(screen.getByRole('radio', { name: 'Đạt' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Ghi chú kiểm duyệt' }), {
      target: { value: 'Chi tiết cần kiểm tra vẫn rõ' },
    })
    fireEvent.click(save)
    expect(api).toHaveBeenLastCalledWith('/api/image-quality/checks/job/reviews', {
      method: 'POST',
      body: { decision: 'PASS', note: 'Chi tiết cần kiểm tra vẫn rõ' },
    })
    expect(await screen.findByText('Chi tiết cần kiểm tra vẫn rõ')).toBeVisible()
    expect(onChanged).toHaveBeenCalledTimes(2)
  })

  it.each(['FAILED', 'CANCELLED'])('asks the Inspector to retry a %s check', async (status) => {
    const job = { id: 'job', media_id: 'image', created_at: '2026-11-26T00:00:00Z', status }
    api.mockResolvedValueOnce([job]).mockResolvedValueOnce(job)
    render(<ImageQualityPanel mediaId="image" />)

    expect(await screen.findByText('Chọn Kiểm tra lại và chờ kết quả để lưu quyết định.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Lưu quyết định' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Kiểm tra lại' })).toBeEnabled()
  })

  it('does not display a fake result after forbidden request', async () => {
    api.mockRejectedValue(new Error('Forbidden'))
    render(<ImageQualityPanel mediaId="other" customer />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.queryByText('Đạt các tiêu chí đã kiểm tra')).not.toBeInTheDocument()
  })
})
