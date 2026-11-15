import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { contractApi } from './contractApi'
import { financeApi } from '../finance/api'
import type { Quote } from '../finance/types'
import type { OrderContract } from './types'
import { QuoteContractPreparation } from './QuoteContractPreparation'
import { ApiError } from '../../shared/api/httpClient'
const quote = {
  id: 'q1',
  version: 2,
  status: 'DRAFT',
  totalAmount: 1000000,
} as Quote
const contract: OrderContract = {
  required: true,
  id: 'c',
  version: 0,
  invoiceId: null,
  quoteId: 'q1',
  quoteVersion: 2,
  contractNumber: 'CTR-01',
  status: 'AWAITING_SIGNATURE',
  issuedAt: null,
  issuedBy: null,
  confirmedAt: null,
  confirmedBy: null,
  document: { fileName: 'official.pdf', byteSize: 100, sha256: 'a'.repeat(64) },
  submissions: [],
}
afterEach(() => vi.restoreAllMocks())
it('requires the prepared PDF before sending and never approves as a side effect of loading', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...contract,
    id: null,
    document: null,
    status: 'NOT_ISSUED',
  })
  const approve = vi.spyOn(financeApi, 'approveQuote')
  render(
    <QuoteContractPreparation
      orderId="o"
      quote={quote}
      onEdit={vi.fn()}
      onSent={vi.fn()}
    />,
  )
  await screen.findByText('Kéo thả một tệp PDF vào đây hoặc chọn từ máy tính.')
  expect(
    screen.getByRole('button', { name: 'Gửi báo giá kèm hợp đồng' }),
  ).toBeDisabled()
  expect(approve).not.toHaveBeenCalled()
})
it('sends the exact persisted quote only after an explicit click', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue(contract)
  const approve = vi
    .spyOn(financeApi, 'approveQuote')
    .mockResolvedValue({ ...quote, status: 'APPROVED' })
  const sent = vi.fn()
  render(
    <QuoteContractPreparation
      orderId="o"
      quote={quote}
      onEdit={vi.fn()}
      onSent={sent}
    />,
  )
  const button = screen.getByRole('button', {
    name: 'Gửi báo giá kèm hợp đồng',
  })
  await waitFor(() => expect(button).toBeEnabled())
  expect(approve).not.toHaveBeenCalled()
  fireEvent.click(button)
  await waitFor(() => expect(sent).toHaveBeenCalledOnce())
  expect(approve).toHaveBeenCalledExactlyOnceWith('o', 'q1')
})
it('a sibling quote document cannot unlock sending', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue({
    ...contract,
    quoteId: 'sibling',
  })
  render(
    <QuoteContractPreparation
      orderId="o"
      quote={quote}
      onEdit={vi.fn()}
      onSent={vi.fn()}
    />,
  )
  await screen.findByText(/Không thể tải thông tin hợp đồng/)
  expect(
    screen.getByRole('button', { name: 'Gửi báo giá kèm hợp đồng' }),
  ).toBeDisabled()
})
it('readiness blockers still prevent sending even with a PDF', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue(contract)
  render(
    <QuoteContractPreparation
      orderId="o"
      quote={quote}
      blockedReason="Cần kiểm tra pháp lý"
      onEdit={vi.fn()}
      onSent={vi.fn()}
    />,
  )
  await screen.findByText('official.pdf')
  expect(
    screen.getByRole('button', { name: 'Gửi báo giá kèm hợp đồng' }),
  ).toBeDisabled()
})
it('a failed send is not reported as success', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue(contract)
  vi.spyOn(financeApi, 'approveQuote').mockRejectedValue(
    new ApiError('storage internals', {
      status: 503,
      code: 'CONTRACT_STORAGE_UNAVAILABLE',
      method: 'POST',
      path: '/',
    }),
  )
  const sent = vi.fn()
  render(
    <QuoteContractPreparation
      orderId="o"
      quote={quote}
      onEdit={vi.fn()}
      onSent={sent}
    />,
  )
  const button = screen.getByRole('button', {
    name: 'Gửi báo giá kèm hợp đồng',
  })
  await waitFor(() => expect(button).toBeEnabled())
  fireEvent.click(button)
  expect(
    await screen.findByText(/Chưa thể truy cập kho lưu trữ hợp đồng/),
  ).toBeInTheDocument()
  expect(screen.queryByText('storage internals')).toBeNull()
  expect(sent).not.toHaveBeenCalled()
})

it('keeps revision metadata and internal contract numbers out of the primary UI', async () => {
  vi.spyOn(contractApi, 'get').mockResolvedValue(contract)
  render(
    <QuoteContractPreparation
      orderId="o"
      quote={quote}
      onEdit={vi.fn()}
      onSent={vi.fn()}
    />,
  )
  await screen.findByText('official.pdf')
  expect(screen.queryByText(/Gắn với báo giá phiên bản/)).toBeNull()
  expect(screen.queryByLabelText('Số hợp đồng')).toBeNull()
  expect(screen.queryByText(contract.contractNumber!)).toBeNull()
})
