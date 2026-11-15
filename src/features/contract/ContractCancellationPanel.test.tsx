import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setLanguage } from '../../shared/i18n'
import { ApiError } from '../../shared/api/httpClient'
import { ContractCancellationPanel } from './ContractCancellationPanel'
import { contractApi } from './contractApi'
import type { ContractCancellation, OrderContract } from './types'
const contract = {
  id: 'contract',
  version: 4,
  status: 'PENDING_VERIFICATION',
  invoiceId: 'invoice',
} as OrderContract
const row: ContractCancellation = {
  id: 'case',
  version: 2,
  status: 'REVIEW_REQUIRED',
  responsibility: 'UNRESOLVED',
  reason: 'The parties cannot proceed',
  basis: null,
  depositPaid: 300000,
  refundId: null,
  requestedAt: '2026-11-14T04:00:00Z',
  requestedBy: 'manager',
  decidedAt: null,
  decidedBy: null,
}
const changed = vi.fn()
beforeEach(() => {
  setLanguage('en')
  vi.spyOn(contractApi, 'cancellation').mockResolvedValue(null)
  changed.mockReset()
})
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})
function panel(manager = true, state = contract) {
  return render(
    <ContractCancellationPanel
      orderId="order"
      contract={state}
      manager={manager}
      onChanged={changed}
    />,
  )
}
async function party(name: string) {
  fireEvent.mouseDown(screen.getByRole('combobox'))
  fireEvent.click(
    await screen.findByText(name, {
      selector: '.ant-select-item-option-content',
    }),
  )
}
it('defaults to unresolved and creates no automatic refund or retention', async () => {
  const cancel = vi.spyOn(contractApi, 'cancel').mockResolvedValue(row)
  panel()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cancel the contract process' }),
  )
  expect(
    screen.getByText(
      'No refund or retention decision yet. The order stops while the case awaits review.',
    ),
  ).toBeInTheDocument()
  const submit = screen.getByRole('button', {
    name: 'Confirm process cancellation',
  })
  expect(submit).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Cancellation reason'), {
    target: { value: row.reason },
  })
  fireEvent.click(submit)
  await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1))
  expect(cancel.mock.calls[0][1]).toMatchObject({
    expectedVersion: 4,
    responsibility: 'UNRESOLVED',
    reason: row.reason,
    customerLiabilityAcknowledged: false,
  })
  expect(cancel.mock.calls[0][1].clientRequestId).toMatch(/^[a-f0-9-]{36}$/)
})
it('requires a basis and explicit acknowledgement to retain a customer deposit', async () => {
  const cancel = vi
    .spyOn(contractApi, 'cancel')
    .mockResolvedValue({ ...row, status: 'DEPOSIT_RETAINED' })
  panel()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cancel the contract process' }),
  )
  await party('Customer')
  fireEvent.change(screen.getByLabelText('Cancellation reason'), {
    target: { value: row.reason },
  })
  fireEvent.change(
    screen.getByLabelText('Basis and applicable contract terms'),
    { target: { value: 'Recorded clause and customer confirmation' } },
  )
  const submit = screen.getByRole('button', {
    name: 'Confirm process cancellation',
  })
  expect(submit).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(submit)
  await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1))
  expect(cancel.mock.calls[0][1]).toMatchObject({
    responsibility: 'CUSTOMER',
    customerLiabilityAcknowledged: true,
  })
})
it('records a versioned decision for an unresolved case', async () => {
  vi.mocked(contractApi.cancellation).mockResolvedValue(row)
  const decide = vi.spyOn(contractApi, 'decideCancellation').mockResolvedValue({
    ...row,
    status: 'REFUND_REQUESTED',
    responsibility: 'SYSTEM',
  })
  panel()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Record a decision' }),
  )
  await party('Service provider')
  fireEvent.change(
    screen.getByLabelText('Basis and applicable contract terms'),
    { target: { value: 'Provider cannot fulfil the signed agreement' } },
  )
  fireEvent.click(screen.getByRole('button', { name: 'Save decision' }))
  await waitFor(() =>
    expect(decide).toHaveBeenCalledWith(
      'order',
      expect.objectContaining({ expectedVersion: 2, responsibility: 'SYSTEM' }),
    ),
  )
})
it('shows refund handoff to the customer without claiming a completed transfer', async () => {
  vi.mocked(contractApi.cancellation).mockResolvedValue({
    ...row,
    status: 'REFUND_REQUESTED',
    responsibility: 'SYSTEM',
    refundId: 'refund',
  })
  panel(false, { ...contract, status: 'CANCELLED' })
  expect(await screen.findByText('Refund requested')).toBeInTheDocument()
  expect(
    screen.getByText(/refunded only after Admin confirms/),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Record a decision' })).toBeNull()
})
it('never exposes cancellation actions for confirmed contracts or pending customer review', () => {
  const { rerender } = panel(false)
  expect(contractApi.cancellation).not.toHaveBeenCalled()
  rerender(
    <ContractCancellationPanel
      orderId="order"
      contract={{ ...contract, status: 'CONFIRMED' }}
      manager
      onChanged={changed}
    />,
  )
  expect(contractApi.cancellation).not.toHaveBeenCalled()
})
it('fails closed when cancellation status cannot be loaded', async () => {
  vi.mocked(contractApi.cancellation).mockRejectedValue(
    new Error('Unavailable'),
  )
  panel()
  expect(
    await screen.findByText(/Unable to load cancellation status/),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Cancel the contract process' }),
  ).toBeNull()
})
it('shows a specific reconciliation warning when an active payment prevents cancellation', async () => {
  vi.spyOn(contractApi, 'cancel').mockRejectedValue(
    new ApiError('pending', {
      status: 409,
      code: 'CONTRACT_CANCELLATION_PENDING_PAYMENT',
      method: 'POST',
      path: '/contract/cancellation',
    }),
  )
  panel()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cancel the contract process' }),
  )
  fireEvent.change(screen.getByLabelText('Cancellation reason'), {
    target: { value: row.reason },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirm process cancellation' }),
  )
  expect(
    await screen.findByText(
      'A payment is still pending. Reconcile it before cancelling.',
    ),
  ).toBeInTheDocument()
  expect(changed).not.toHaveBeenCalled()
})
