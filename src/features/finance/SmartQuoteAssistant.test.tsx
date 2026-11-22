import { render, screen, fireEvent } from '@testing-library/react'
import { vi, test, expect } from 'vitest'
import { SmartQuoteAssistant } from './SmartQuoteAssistant'
import { apiRequest } from '../../shared/api/httpClient'
vi.mock('../../shared/api/httpClient', () => ({ apiRequest: vi.fn() }))
vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  return { ...actual, Table: () => <div>Chi phí báo giá</div> }
})
test('opens authoritative breakdown and sends read-only scope comparison', async () => {
  vi.mocked(apiRequest).mockResolvedValueOnce({ revision: 'r1', version: 1, total: 2250000, warnings: [], items: [] })
    .mockResolvedValueOnce({ revision: 'r1', options: [{ label: 'Phương án mới', total: null, status: 'NEEDS_MANUAL_QUOTE', explanation: 'Cần nhân viên báo giá lại.' }] })
  render(<SmartQuoteAssistant orderId="o" quoteId="q" customer />)
  const details = screen.getByText('Hiểu báo giá của bạn').parentElement! as HTMLDetailsElement
  details.open = true
  fireEvent(details, new Event('toggle'))
  expect(await screen.findByText('Chi phí báo giá')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Thay đổi phương án'), { target: { value: 'Bỏ video' } })
  fireEvent.click(screen.getByRole('button', { name: 'So sánh phương án' }))
  expect(await screen.findByText('Phương án mới: Cần báo giá lại')).toBeTruthy()
  expect(vi.mocked(apiRequest).mock.calls[1][0]).toBe('/api/customer/orders/o/quotes/q/compare')
})
