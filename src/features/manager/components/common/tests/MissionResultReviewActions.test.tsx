import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { missionsApi } from '../../../api/missionsApi'
import { MissionResultReviewActions } from '../MissionResultReviewActions'

afterEach(() => vi.restoreAllMocks())
describe('MissionResultReviewActions', () => {
  it.each(['DRAFT', 'REJECTED', 'APPROVED'] as const)(
    'never offers review for %s',
    (status) => {
      render(
        <MissionResultReviewActions
          resultId="r"
          status={status}
          ready
          onReviewed={vi.fn()}
        />,
      )
      expect(screen.queryByRole('button', { name: 'Duyệt kết quả' })).toBeNull()
      expect(
        screen.queryByRole('button', { name: 'Từ chối kết quả' }),
      ).toBeNull()
    },
  )
  it('approves only the pending result, never media, then refreshes', async () => {
    const approve = vi
      .spyOn(missionsApi, 'approveMissionResult')
      .mockResolvedValue({} as never)
    const media = vi.spyOn(missionsApi, 'approveMissionMedia')
    const refresh = vi.fn()
    render(
      <MissionResultReviewActions
        resultId="r"
        status="PENDING_MANAGER_APPROVAL"
        ready
        onReviewed={refresh}
      />,
    )
    fireEvent.click(screen.getByText('Duyệt kết quả'))
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    expect(approve).toHaveBeenCalledWith('r', '')
    expect(media).not.toHaveBeenCalled()
  })
  it('rejects using the optional backend note and refreshes', async () => {
    const reject = vi
      .spyOn(missionsApi, 'rejectMissionResult')
      .mockResolvedValue({} as never)
    const refresh = vi.fn()
    render(
      <MissionResultReviewActions
        resultId="r"
        status="PENDING_MANAGER_APPROVAL"
        ready
        onReviewed={refresh}
      />,
    )
    fireEvent.change(screen.getByLabelText('Ghi chú / lý do'), {
      target: { value: 'Cần kiểm tra lại' },
    })
    fireEvent.click(screen.getByText('Từ chối kết quả'))
    await waitFor(() =>
      expect(reject).toHaveBeenCalledWith('r', 'Cần kiểm tra lại'),
    )
    expect(refresh).toHaveBeenCalledOnce()
  })
  it('disables approve when readiness is unknown/false but allows rejecting', () => {
    render(
      <MissionResultReviewActions
        resultId="r"
        status="PENDING_MANAGER_APPROVAL"
        ready={false}
        onReviewed={vi.fn()}
      />,
    )
    expect(screen.getByText('Duyệt kết quả')).toBeDisabled()
    expect(screen.getByText('Từ chối kết quả')).not.toBeDisabled()
  })
})
