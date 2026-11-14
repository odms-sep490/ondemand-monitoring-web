import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MissionPaymentMilestonesSection } from '../components/MissionPaymentMilestonesSection'
import type {
  MissionPaymentAllocation,
  MissionPaymentMilestone,
} from '../../types'
const planned: MissionPaymentMilestone = {
  id: 'planned',
  missionId: 'm2',
  missionCode: 'MS-2',
  scopeLabel: 'Future Mission',
  amount: 2000000,
  currency: 'VND',
  status: 'NOT_YET_DUE',
  handedOverAt: null,
  paymentExpiresAt: null,
  payments: [],
}
const delivered: MissionPaymentMilestone = {
  ...planned,
  id: 'delivered',
  missionId: 'm1',
  missionCode: 'MS-1',
  scopeLabel: 'Delivered Mission',
  amount: 1000000,
  status: 'UNPAID',
  handedOverAt: '2026-11-14T04:00:00Z',
}
function panel(milestones: MissionPaymentMilestone[], extra = {}) {
  const allocation: MissionPaymentAllocation = {
    invoiceId: 'invoice',
    allocationTargetAmount: 3500000,
    allocatedAmount: 3000000,
    allocationComplete: false,
    milestones,
  }
  const pay = vi.fn()
  render(
    <MissionPaymentMilestonesSection
      allocation={allocation}
      loading={false}
      error={null}
      busy={false}
      onPay={pay}
      onTestPay={vi.fn()}
      {...extra}
    />,
  )
  return pay
}
it('does not expose planned Missions after deposit but before any handover', () => {
  panel([planned])
  expect(screen.queryByRole('heading')).toBeNull()
  expect(screen.queryByText('Future Mission')).toBeNull()
})
it('shows only handed-over Missions without exposing allocation warnings or future amounts', () => {
  const pay = panel([delivered, planned])
  expect(screen.getByText('Delivered Mission')).toBeInTheDocument()
  expect(screen.queryByText('Future Mission')).toBeNull()
  expect(
    screen.queryByText('Tổng phân bổ thanh toán chưa khớp số dư hóa đơn.'),
  ).toBeNull()
  expect(
    screen.getByLabelText('Đã thanh toán / Tổng tiền các nhiệm vụ đã bàn giao'),
  ).toHaveTextContent('0 ₫ / 1.000.000 ₫')
  fireEvent.click(screen.getByRole('button', { name: 'Thanh toán' }))
  expect(pay).toHaveBeenCalledWith('delivered')
})
it('retains paid Mission history after payment', () => {
  panel([{ ...delivered, status: 'PAID' }])
  expect(screen.getByText('Delivered Mission')).toBeInTheDocument()
  expect(
    screen.getByLabelText('Đã thanh toán / Tổng tiền các nhiệm vụ đã bàn giao'),
  ).toHaveTextContent('1.000.000 ₫ / 1.000.000 ₫')
  expect(screen.queryByRole('button', { name: 'Thanh toán' })).toBeNull()
})
it('does not flash the card on an initial loading or error response without a handover', () => {
  panel([], { loading: true, error: 'Unavailable' })
  expect(screen.queryByRole('heading')).toBeNull()
})
it('does not infer a handover from payable status without its timestamp', () => {
  panel([{ ...planned, status: 'UNPAID' }])
  expect(screen.queryByRole('heading')).toBeNull()
})
