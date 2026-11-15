import { render, screen, fireEvent } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { PlanningPaymentGate } from '../manager/pages/OrderReview/components/PlanningPaymentGate'
it('shows the quote/contract customer step before there is an invoice instead of demanding a deposit', () => {
  const refresh = vi.fn().mockResolvedValue(undefined)
  render(
    <PlanningPaymentGate
      checkingPayment={false}
      checkPayment={refresh}
      data={
        { invoice: null, order: { id: 'o' }, missions: [], plan: {} } as never
      }
    />,
  )
  expect(
    screen.getByText('Chờ khách hàng chấp nhận báo giá và ký hợp đồng'),
  ).toBeInTheDocument()
  expect(
    screen.queryByText('Đang chờ khách hàng thanh toán đặt cọc'),
  ).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật trạng thái' }))
  expect(refresh).toHaveBeenCalledOnce()
})
