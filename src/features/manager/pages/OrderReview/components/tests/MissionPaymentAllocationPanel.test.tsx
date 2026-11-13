import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../../../../shared/i18n'
import { financeApi } from '../../../../../finance/api'
import { MissionPaymentAllocationPanel } from '../MissionPaymentAllocationPanel'

afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('MissionPaymentAllocationPanel', () => {
  it('shows auto-calculated per-Mission payment amounts (read-only)', async () => {
    const calculate = vi
      .spyOn(financeApi, 'calculateManagerMissionPaymentAllocations')
      .mockResolvedValue({
        invoiceId: 'invoice-1',
        allocationTargetAmount: 700,
        allocatedAmount: 700,
        allocationComplete: true,
        milestones: [
          {
            id: 'ms-1',
            missionId: 'mission-1',
            missionCode: 'MS-101',
            scopeLabel: 'Khu vực nhà xưởng',
            amount: 700,
            currency: 'VND',
            status: 'UNPAID',
            handedOverAt: null,
            paymentExpiresAt: null,
            payments: [],
          },
        ],
      })
    render(
      <MissionPaymentAllocationPanel
        orderId="order-1"
        invoice={{ totalAmount: 1000, depositAmount: 300 }}
        allocation={null}
      />,
    )

    await waitFor(() => expect(calculate).toHaveBeenCalledWith('order-1'))
    expect(await screen.findByText('Khu vực nhà xưởng')).toBeInTheDocument()
    expect(screen.getByText('MS-101')).toBeInTheDocument()
    expect(screen.getByText('Chờ thanh toán')).toBeInTheDocument()
    expect(screen.getAllByText(/700/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Lưu phân bổ' })).toBeNull()
  })

  it('shows an error when the allocation cannot be calculated', async () => {
    vi.spyOn(
      financeApi,
      'calculateManagerMissionPaymentAllocations',
    ).mockRejectedValue(new Error('boom'))
    render(
      <MissionPaymentAllocationPanel
        orderId="order-1"
        invoice={{ totalAmount: 1000, depositAmount: 300 }}
        allocation={null}
      />,
    )
    expect(
      await screen.findByText(/Chưa thể tính tự động/),
    ).toBeInTheDocument()
  })
})
