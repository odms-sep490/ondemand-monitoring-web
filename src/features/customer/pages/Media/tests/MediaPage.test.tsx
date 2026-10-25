import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { customerMissionReportApi } from '../../../api/customerMissionReportApi'
import { MediaPage } from '../MediaPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

describe('MediaPage', () => {
  it('renders the Vietnamese title', async () => {
    render(<MediaPage orderId="cus-ord-006" />)
    expect(await screen.findByText('Kết quả của đơn hàng')).toBeInTheDocument()
  })

  it('renders the English title when language is switched', async () => {
    render(<MediaPage orderId="cus-ord-006" />)
    await screen.findByText('Kết quả của đơn hàng')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Order results')).toBeInTheDocument()
  })

  it('groups the order media under its missions from the history', async () => {
    render(<MediaPage orderId="cus-ord-006" />)
    expect(await screen.findByText('MSN-2609-0131-1')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /^Xem / })).toHaveLength(15),
    )
  })

  it('opens the preview modal for a file', async () => {
    render(<MediaPage orderId="cus-ord-006" />)
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: /^Xem / }).length,
      ).toBeGreaterThan(0),
    )
    fireEvent.click(screen.getAllByRole('button', { name: /^Xem / })[0])
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('shows a mission without files, and the empty state when the order has no mission', async () => {
    const { unmount } = render(<MediaPage orderId="cus-ord-009" />)
    expect(
      await screen.findByText('Lần bay này chưa có tệp nào được xác thực.'),
    ).toBeInTheDocument()
    unmount()
    render(<MediaPage orderId="cus-ord-003" />)
    expect(
      await screen.findByText('Chưa lên lịch giám sát'),
    ).toBeInTheDocument()
  })

  it('shows an error with retry and recovers', async () => {
    vi.spyOn(customerMediaApi, 'listMissionMedia').mockRejectedValueOnce(
      new Error('boom'),
    )
    render(<MediaPage orderId="cus-ord-006" />)
    expect(
      await screen.findByText('Không tải được kết quả của đơn'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByText('MSN-2609-0131-1')).toBeInTheDocument()
  })

  it('reads the authorized Order Mission collection instead of terminal history', async () => {
    const spy = vi.spyOn(customerMissionReportApi, 'list')
    render(<MediaPage orderId="cus-ord-006" />)
    await screen.findByText('MSN-2609-0131-1')
    expect(spy).toHaveBeenCalledWith('cus-ord-006', expect.any(AbortSignal))
  })
})
