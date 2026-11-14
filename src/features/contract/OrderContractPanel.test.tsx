import { afterEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ApiError } from '../../shared/api/httpClient'
import { setLanguage } from '../../shared/i18n'
import { contractApi } from './contractApi'
import { OrderContractPanel } from './OrderContractPanel'
import type { OrderContract } from './types'
const base: OrderContract = {
  required: true,
  id: 'contract',
  version: 4,
  invoiceId: 'invoice',
  quoteId: 'quote',
  quoteVersion: 2,
  contractNumber: 'CTR-01',
  status: 'AWAITING_SIGNATURE',
  issuedAt: '2026-11-14T03:00:00Z',
  issuedBy: 'manager',
  confirmedAt: null,
  confirmedBy: null,
  document: { fileName: 'official.pdf', byteSize: 100, sha256: 'a'.repeat(64) },
  submissions: [],
}
const file = () =>
  new File(['%PDF-test'], 'signed.pdf', { type: 'application/pdf' })
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})
it('requires an explicit signed-file submission with the current version', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue(base)
  const submit = vi
    .spyOn(contractApi, 'submit')
    .mockResolvedValue({ ...base, status: 'PENDING_VERIFICATION' })
  render(<OrderContractPanel orderId="order" mode="customer" />)
  const button = await screen.findByRole('button', {
    name: 'Gửi hợp đồng đã ký',
  })
  expect(button).toBeDisabled()
  const pdf = file()
  fireEvent.change(screen.getByLabelText('Chọn bản PDF đã ký'), {
    target: { files: [pdf] },
  })
  expect(button).toBeDisabled()
  fireEvent.click(
    screen.getByRole('checkbox', { name: /Tôi xác nhận tệp này/ }),
  )
  fireEvent.click(button)
  await waitFor(() =>
    expect(submit).toHaveBeenCalledExactlyOnceWith('order', 4, pdf),
  )
})
it('does not let a customer confirm or upload over a pending submission', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...base,
    status: 'PENDING_VERIFICATION',
  })
  render(<OrderContractPanel orderId="order" mode="customer" />)
  await screen.findByText(/Đã nhận bản hợp đồng của bạn/)
  expect(screen.queryByRole('button', { name: 'Xác nhận hợp đồng' })).toBeNull()
  expect(screen.queryByLabelText('Chọn bản PDF đã ký')).toBeNull()
})
it('manager issues the official PDF for the accepted quote', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...base,
    id: null,
    status: 'NOT_ISSUED',
    document: null,
  })
  const issue = vi.spyOn(contractApi, 'issue').mockResolvedValue(base)
  render(<OrderContractPanel orderId="order" mode="manager" />)
  await screen.findByRole('button', { name: 'Phát hành hợp đồng' })
  fireEvent.change(screen.getByLabelText('Số hợp đồng'), {
    target: { value: 'CTR-2026' },
  })
  const pdf = file()
  fireEvent.change(screen.getByLabelText('Chọn PDF hợp đồng'), {
    target: { files: [pdf] },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Phát hành hợp đồng' }))
  await waitFor(() =>
    expect(issue).toHaveBeenCalledExactlyOnceWith(
      'order',
      'quote',
      'CTR-2026',
      pdf,
    ),
  )
})
const submission = {
  id: 'signed-1',
  submissionNumber: 1,
  status: 'PENDING' as const,
  submittedAt: '2026-11-14T04:00:00Z',
  submittedBy: 'customer',
  reviewedAt: null,
  reviewedBy: null,
  reviewNote: null,
  document: base.document!,
}
it('manager confirmation requires reviewing the latest submitted file', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...base,
    status: 'PENDING_VERIFICATION',
    submissions: [submission],
  })
  const confirm = vi
    .spyOn(contractApi, 'confirm')
    .mockResolvedValue({ ...base, status: 'CONFIRMED' })
  render(<OrderContractPanel orderId="order" mode="manager" />)
  const button = await screen.findByRole('button', {
    name: 'Xác nhận hợp đồng',
  })
  expect(button).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox', { name: /Tôi đã đối chiếu/ }))
  fireEvent.click(button)
  await waitFor(() =>
    expect(confirm).toHaveBeenCalledExactlyOnceWith('order', 4, 'signed-1'),
  )
})
it('a change request needs a reason and targets the exact current submission', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...base,
    status: 'PENDING_VERIFICATION',
    submissions: [submission],
  })
  const changes = vi
    .spyOn(contractApi, 'requestChanges')
    .mockResolvedValue({ ...base, status: 'CHANGES_REQUESTED' })
  render(<OrderContractPanel orderId="order" mode="manager" />)
  const button = await screen.findByRole('button', { name: 'Yêu cầu bổ sung' })
  expect(button).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Lý do cần bổ sung'), {
    target: { value: ' Thiếu chữ ký ' },
  })
  fireEvent.click(button)
  await waitFor(() =>
    expect(changes).toHaveBeenCalledExactlyOnceWith(
      'order',
      4,
      'signed-1',
      'Thiếu chữ ký',
    ),
  )
})
it('rejects invalid files and localizes the error after changing language', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue(base)
  render(<OrderContractPanel orderId="order" mode="customer" />)
  await screen.findByLabelText('Chọn bản PDF đã ký')
  fireEvent.change(screen.getByLabelText('Chọn bản PDF đã ký'), {
    target: { files: [new File(['bad'], 'bad.png')] },
  })
  expect(screen.getByRole('alert')).toHaveTextContent('Hãy chọn PDF')
  act(() => setLanguage('en'))
  expect(screen.getByRole('alert')).toHaveTextContent('Select a non-empty PDF')
})
it('read failures stay visible and never imply verification succeeded', async () => {
  vi.spyOn(contractApi, 'get').mockRejectedValue(
    new ApiError('PRIVATE_SERVER_DETAIL', {
      method: 'GET',
      path: '/',
      status: 403,
    }),
  )
  const confirmed = vi.fn()
  render(
    <OrderContractPanel
      orderId="order"
      mode="customer"
      onConfirmed={confirmed}
    />,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Thanh toán cọc vẫn bị khóa',
  )
  expect(screen.queryByText('PRIVATE_SERVER_DETAIL')).toBeNull()
  expect(confirmed).not.toHaveBeenCalled()
})
it('confirmed state notifies the parent once and shows the review history', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...base,
    status: 'CONFIRMED',
    confirmedAt: '2026-11-14T05:00:00Z',
    submissions: [
      {
        ...submission,
        status: 'CONFIRMED',
        reviewedAt: '2026-11-14T05:00:00Z',
        reviewedBy: 'manager',
      },
    ],
  })
  const confirmed = vi.fn()
  render(
    <OrderContractPanel
      orderId="order"
      mode="customer"
      onConfirmed={confirmed}
    />,
  )
  await screen.findByText(/Hợp đồng đã được quản lý xác nhận/)
  expect(confirmed).toHaveBeenCalledTimes(1)
  expect(screen.getByText('Lần gửi 1')).toBeInTheDocument()
})
