import { afterEach, beforeEach, expect, it, vi } from 'vitest'
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
beforeEach(() => {
  vi.spyOn(contractApi, 'cancellation').mockResolvedValue(null)
})
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
it('allows replacing the pending signed copy with a new versioned upload', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...base,
    status: 'PENDING_VERIFICATION',
    submissions: [
      {
        id: 'signed',
        submissionNumber: 1,
        status: 'PENDING',
        submittedAt: '2026-11-14T04:00:00Z',
        submittedBy: 'customer',
        reviewedAt: null,
        reviewedBy: null,
        reviewNote: null,
        document: base.document!,
      },
    ],
  })
  const submit = vi
    .spyOn(contractApi, 'submit')
    .mockResolvedValue({ ...base, version: 5, status: 'PENDING_VERIFICATION' })
  render(<OrderContractPanel orderId="order" mode="customer" />)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Thay tệp đã gửi' }),
  )
  const button = screen.getByRole('button', { name: 'Thay bản hợp đồng đã ký' })
  expect(button).toBeDisabled()
  const pdf = file()
  fireEvent.change(screen.getByLabelText('Chọn bản PDF đã ký'), {
    target: { files: [pdf] },
  })
  fireEvent.click(
    screen.getByRole('checkbox', { name: /Tôi xác nhận tệp này/ }),
  )
  fireEvent.click(button)
  await waitFor(() => expect(submit).toHaveBeenCalledWith('order', 4, pdf))
  expect(screen.queryByRole('button', { name: 'Xác nhận hợp đồng' })).toBeNull()
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
  await screen.findByRole('button', { name: 'Lưu hợp đồng PDF' })
  expect(screen.queryByLabelText('Số hợp đồng')).toBeNull()
  expect(screen.queryByText(/Gắn với báo giá phiên bản/)).toBeNull()
  const pdf = file()
  fireEvent.change(screen.getByLabelText('Chọn PDF hợp đồng'), {
    target: { files: [pdf] },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu hợp đồng PDF' }))
  await waitFor(() =>
    expect(issue).toHaveBeenCalledExactlyOnceWith(
      'order',
      'quote',
      undefined,
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
    'Hãy làm mới trước khi tiếp tục',
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
  await screen.findByText(/Hợp đồng đã được xác nhận. Khi đã đủ cọc/)
  expect(confirmed).toHaveBeenCalledTimes(1)
  expect(screen.getByText('Lần gửi 1')).toBeInTheDocument()
})

it('customer can read the prepared contract before accepting but cannot upload a signed copy yet', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({ ...base, invoiceId: null })
  render(<OrderContractPanel orderId="order" quoteId="quote" mode="customer" />)
  expect(
    await screen.findByRole('button', { name: 'Tải hợp đồng chính thức' }),
  ).toBeEnabled()
  expect(
    screen.getByText(/Chấp nhận báo giá để tiếp tục gửi bản đã ký/),
  ).toBeInTheDocument()
  expect(screen.queryByLabelText('Chọn bản PDF đã ký')).toBeNull()
})
it('reloads the contract immediately when quote acceptance creates an invoice', async () => {
  const get = vi
    .spyOn(contractApi, 'get')
    .mockResolvedValue({ ...base, invoiceId: null })
  const { rerender } = render(
    <OrderContractPanel orderId="order" quoteId="quote" mode="customer" />,
  )
  await screen.findByText(/Chấp nhận báo giá để tiếp tục gửi bản đã ký/)
  get.mockResolvedValue(base)
  rerender(
    <OrderContractPanel
      orderId="order"
      quoteId="quote"
      refreshKey="invoice"
      mode="customer"
    />,
  )
  expect(await screen.findByLabelText('Chọn bản PDF đã ký')).toBeInTheDocument()
})

it('supports one dropped PDF and rejects a multi-file drop without uploading', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...base,
    id: null,
    status: 'NOT_ISSUED',
    document: null,
  })
  const issue = vi.spyOn(contractApi, 'issue')
  render(<OrderContractPanel orderId="order" mode="manager" />)
  const input = await screen.findByLabelText('Chọn PDF hợp đồng')
  const area = input.closest('.order-contract-panel__file')!
  fireEvent.drop(area, { dataTransfer: { files: [file()] } })
  expect(screen.getByText('signed.pdf')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Lưu hợp đồng PDF' })).toBeEnabled()
  fireEvent.drop(area, { dataTransfer: { files: [file(), file()] } })
  expect(
    screen.getByRole('button', { name: 'Lưu hợp đồng PDF' }),
  ).toBeDisabled()
  expect(
    await screen.findByText('Hãy chọn PDF không rỗng, tối đa 10 MB.'),
  ).toBeInTheDocument()
  expect(issue).not.toHaveBeenCalled()
})

it('refreshes invoice eligibility after a signed submission without pretending it was confirmed', async () => {
  const get = vi.spyOn(contractApi, 'get').mockResolvedValue(base)
  const updated = vi.fn(),
    confirmed = vi.fn()
  vi.spyOn(contractApi, 'submit').mockImplementation(async () => {
    const pending = {
      ...base,
      version: 5,
      status: 'PENDING_VERIFICATION' as const,
    }
    get.mockResolvedValue(pending)
    return pending
  })
  render(
    <OrderContractPanel
      orderId="order"
      mode="customer"
      onUpdated={updated}
      onConfirmed={confirmed}
    />,
  )
  const button = await screen.findByRole('button', {
    name: 'Gửi hợp đồng đã ký',
  })
  fireEvent.change(screen.getByLabelText('Chọn bản PDF đã ký'), {
    target: { files: [file()] },
  })
  fireEvent.click(
    screen.getByRole('checkbox', { name: /Tôi xác nhận tệp này/ }),
  )
  fireEvent.click(button)
  await waitFor(() => expect(updated).toHaveBeenCalledTimes(1))
  expect(confirmed).not.toHaveBeenCalled()
  expect(
    await screen.findByText(/Bạn vẫn có thể thanh toán cọc trong khi chờ/),
  ).toBeInTheDocument()
})

it('keeps replacement disabled after confirmation and hides download for superseded history', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...base,
    status: 'CONFIRMED',
    submissions: [
      {
        id: 'old',
        submissionNumber: 1,
        status: 'SUPERSEDED',
        submittedAt: '2026-11-14T04:00:00Z',
        submittedBy: 'customer',
        reviewedAt: null,
        reviewedBy: null,
        reviewNote: null,
        document: base.document!,
      },
    ],
  })
  render(<OrderContractPanel orderId="order" mode="customer" />)
  expect(await screen.findByText('Đã được thay thế')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Thay tệp đã gửi' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Tải bản đã ký' })).toBeNull()
  expect(screen.getByText(/Bản này đã được thay thế/)).toBeInTheDocument()
})

it('requires Manager to acknowledge the new file again after a Customer replacement', async () => {
  const get = vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...base,
    status: 'PENDING_VERIFICATION',
    submissions: [submission],
  })
  render(<OrderContractPanel orderId="order" mode="manager" />)
  const button = await screen.findByRole('button', {
    name: 'Xác nhận hợp đồng',
  })
  fireEvent.click(screen.getByRole('checkbox', { name: /Tôi đã đối chiếu/ }))
  expect(button).toBeEnabled()
  get.mockResolvedValue({
    ...base,
    version: 5,
    status: 'PENDING_VERIFICATION',
    submissions: [{ ...submission, id: 'replacement', submissionNumber: 2 }],
  })
  fireEvent(window, new Event('focus'))
  await waitFor(() => expect(screen.getByText('Lần gửi 2')).toBeInTheDocument())
  expect(
    screen.getByRole('button', { name: 'Xác nhận hợp đồng' }),
  ).toBeDisabled()
  expect(
    screen.getByRole('checkbox', { name: /Tôi đã đối chiếu/ }),
  ).not.toBeChecked()
})
