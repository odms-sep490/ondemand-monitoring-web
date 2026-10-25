import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { SafeStop } from '../../manager/types/planning'
import { SafeStopSummary } from './SafeStopSummary'

describe('safe-stop summary runtime resilience', () => {
  it.each([null, undefined])(
    'missing response renders a localized unknown state: %s',
    (stop) => {
      render(<SafeStopSummary actor="staff" stop={stop} />)
      expect(screen.getByText('Cần kiểm tra trạng thái')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    },
  )
  it.each([
    [{ missionId: 'm' }, 'Chưa có yêu cầu'],
    [{ missionId: 'm', status: 'REQUESTED' }, 'Đã yêu cầu dừng'],
    [
      {
        missionId: 'm',
        status: 'IN_PROGRESS',
        confirmedAt: '2026-10-10T00:00:00Z',
      },
      'Đã xác nhận an toàn',
    ],
    [
      { missionId: 'm', status: 'READY_FOR_CANCELLATION' },
      'Đã hoàn tất dừng an toàn',
    ],
    [{ missionId: 'm', status: 'FAILED' }, 'Cần xử lý lại'],
    [{ missionId: 'm', status: 'FUTURE_STATUS' }, 'Cần kiểm tra trạng thái'],
  ])('partial response renders safely: %s', (stop, label) => {
    render(<SafeStopSummary actor="staff" stop={stop as SafeStop} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
