import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { SummaryBanner } from '../components/SummaryBanner'

const onReady = vi.fn()

function renderBanner(
  overrides: Partial<Parameters<typeof SummaryBanner>[0]> = {},
) {
  return render(
    <SummaryBanner
      nOk={11}
      nTotal={11}
      progress={100}
      isReady
      isFailed={false}
      failedItems={[]}
      error={null}
      hasTriggered
      triggering={false}
      onTrigger={vi.fn()}
      onReady={onReady}
      missionId="mission-1"
      replacementRequesting={false}
      replacementRequested={false}
      replacementRequestError={null}
      onRequestDroneReplacement={vi.fn()}
      {...overrides}
    />,
  )
}

describe('SummaryBanner', () => {
  beforeEach(() => {
    setLanguage('vi')
    onReady.mockClear()
  })

  it('shows the live checklist count and calls the handover action', () => {
    renderBanner({
      nOk: 7,
      nTotal: 9,
      backendPreflightMessage:
        'Every required pre-flight item must pass before the mission can be marked ready to fly.',
    })

    expect(screen.getByText('7/9')).toBeTruthy()
    expect(screen.getByText('ĐẠT · đủ điều kiện cất cánh')).toBeTruthy()
    expect(
      screen.getByText(
        'Tất cả hạng mục kiểm tra trước bay bắt buộc phải đạt trước khi nhiệm vụ sẵn sàng cất cánh.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText(/Every required pre-flight item/)).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: /Tiếp tục tới bàn giao/ }),
    )
    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it('keeps the current registration lock on the handover action', () => {
    renderBanner({ backendPreflightRegistering: true })

    const button = screen.getByRole('button', {
      name: /Đang cập nhật trạng thái thiết bị/,
    })
    expect(button).toHaveProperty('disabled', true)
    fireEvent.click(button)
    expect(onReady).not.toHaveBeenCalled()
  })
})
