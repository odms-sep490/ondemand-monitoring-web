import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../../../../shared/i18n'
import { financeApi } from '../../../../../finance/api'
import type { MissionResponse } from '../../../../types/missions'
import { MissionPaymentAllocationPanel } from '../MissionPaymentAllocationPanel'

const mission = {
  id: 'mission-1',
  missionCode: 'MS-101',
  scopeLabel: 'Khu vực nhà xưởng',
  purpose: 'ORIGINAL',
  status: 'PENDING_CONFIRMATION',
} as MissionResponse

afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('MissionPaymentAllocationPanel', () => {
  it('saves explicit Manager agreed amounts when their sum matches the balance', async () => {
    const configure = vi.spyOn(financeApi, 'configureManagerMissionPaymentAllocations').mockResolvedValue({
      invoiceId: 'invoice-1',
      allocationTargetAmount: 700,
      allocatedAmount: 700,
      allocationComplete: true,
      milestones: [],
    })
    const onSaved = vi.fn()
    render(
      <MissionPaymentAllocationPanel
        orderId="order-1"
        invoice={{ totalAmount: 1000, depositAmount: 300 }}
        missions={[mission]}
        allocation={null}
        onSaved={onSaved}
      />,
    )

    fireEvent.change(screen.getByLabelText('Giá trị thanh toán (VND)'), {
      target: { value: '700' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu phân bổ' }))

    await waitFor(() =>
      expect(configure).toHaveBeenCalledWith('order-1', [
        { missionId: 'mission-1', amount: 700 },
      ]),
    )
    expect(onSaved).toHaveBeenCalledTimes(1)
  })
})
