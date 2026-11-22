import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OrderPreReviewPanel } from './OrderPreReviewPanel'

describe('OrderPreReviewPanel', () => {
  it('shows pending verification without presenting it as a failed rule', () => {
    const refresh = vi.fn()
    render(<OrderPreReviewPanel loading={false} onRefresh={refresh} result={{
      orderId: 'test-order',
      canApprove: false,
      recommendation: 'COMPLETE_REVIEW',
      blockingReasons: [],
      criteria: [{
        code: 'TEST', type: 'MANUAL', title: 'Kiểm tra tài liệu', description: 'Đối chiếu bản gốc',
        required: true, result: 'PENDING', reason: null, note: null, decidedByName: null, decidedAt: null,
      }],
    }} />)
    expect(screen.getByText('Chưa xác minh 1')).toBeTruthy()
    expect(screen.queryByText('Cần xử lý')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lại' }))
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: /duyệt|approve/i })).toBeNull()
  })

  it('offers retry when evaluation fails', () => {
    render(<OrderPreReviewPanel loading={false} onRefresh={() => {}} error={new Error('offline')} result={null} />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.queryByText('Các điều kiện đã kiểm tra đều đạt.')).toBeNull()
  })
})
