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
  it('does not display a fake result after forbidden request', async () => {
    api.mockRejectedValue(new Error('Forbidden'))
    render(<ImageQualityPanel mediaId="other" customer />)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.queryByText('Đạt các tiêu chí đã kiểm tra')).not.toBeInTheDocument()
  })
})
